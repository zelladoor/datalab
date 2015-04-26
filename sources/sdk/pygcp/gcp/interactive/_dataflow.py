# Copyright 2014 Google Inc. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Implements interactive authoring experience for Dataflow pipelines."""

from cloud.dataflow.io.iobase import Sink
from cloud.dataflow.io.iobase import SinkWriter
from cloud.dataflow.io.iobase import Source
from cloud.dataflow.io.iobase import SourceReader
from cloud.dataflow.pipeline import Pipeline
from cloud.dataflow.pipeline import PipelineVisitor
from cloud.dataflow.pvalue import PCollection
from cloud.dataflow.runners import DirectPipelineRunner
from cloud.dataflow.transforms.window import BoundedWindow

from gcp.dataflow import Catalog

from ._html import Html as _Html
import argparse as _argparse
import inspect as _inspect
import json as _json
import sys as _sys

try:
  import IPython as _ipython
  import IPython.core.magic as _magic
except ImportError:
  raise Exception('This module can only be loaded in ipython.')


class Dataflow(object):

  def __init__(self, ns):
    self._init_pipeline, args = Dataflow._find_function(ns, 'init_pipeline', 3,
                                                        '(pipeline[, catalog[, options]])')
    self._catalog = None
    self._options = None

    if args > 1:
      # init_pipeline takes in a catalog object; look for init_catalog method
      self._init_catalog, _ = Dataflow._find_function(ns, 'init_catalog', 2, '(catalog[, options])')
      self._catalog = LocalCatalog(ns)
    if args > 2:
      # init_pipeline takes in an options object; look for init_options method
      init_options, _ = Dataflow._find_function(ns, 'init_options', 1, '(options)')

      self._options_parser = DataflowOptionsParser()
      init_options(self._options_parser)

  @property
  def data(self):
    data_collector = Dataflow.DataCollector()
    return data_collector.visit(self._pipeline)

  @property
  def graph(self):
    graph_builder = Dataflow.GraphBuilder()
    return graph_builder.visit(self._pipeline)

  def run(self, args):
    self._runner = DirectPipelineRunner()
    self._pipeline = Pipeline(self._runner)

    options = None
    if self._options_parser is not None:
      options = self._options_parser._parse(args)

    if self._catalog is None:
      if options is None:
        self._init_pipeline(self._pipeline)
      else:
        self._init_pipeline(self._pipeline, options)
    else:
      if options is None:
        self._init_catalog(self._catalog)
        self._init_pipeline(self._pipeline, self._catalog)
      else:
        self._init_catalog(self._catalog, options)
        self._init_pipeline(self._pipeline, self._catalog, options)

    self._pipeline.run()

  @staticmethod
  def _find_function(ns, name, max_args, signature):
    fn = ns.get(name, None)
    if (fn is None) or not callable(fn):
      raise RuntimeError('A function named "%s" could not be found.' % name)

    args = len(_inspect.getargspec(fn)[0])
    if (args < 1) or (args > max_args):
      raise RuntimeError('The function named "%s" with the signature "%s" could not be found.' %
                         (name, signature))

    return fn, args

  class DataCollector(PipelineVisitor):

    def __init__(self):
      self._data = dict()

    def visit_value(self, value, producer_node):
      if type(value) == PCollection:
        items = list(value.get())
        collection = {
          'count': len(items),
          'data': items[:25]
        }

        self._data[producer_node.full_label] = collection

    def visit(self, pipeline):
      pipeline.visit(self)
      return self._data


  class GraphBuilder(PipelineVisitor):

    def __init__(self):
      self._nodes = list()
      self._node_stack = list()
      self._node_map = dict()

    def add_node(self, transform_node):
      label = transform_node.full_label
      name = label

      slash_index = name.rfind('/')
      if slash_index > 0:
        name = name[slash_index + 1:]

      graph_node = {
        'id': label,
        'name': name,
        'nodes': [],
        'edges': []
      }

      self._node_map[label] = graph_node

      if len(self._node_stack) == 0:
        self._nodes.append(graph_node)
      else:
        self._node_stack[-1].get('nodes').append(graph_node)

      for input_value in transform_node.inputs:
        parent_node = self._node_map[input_value.producer.full_label]
        parent_node.get('edges').append(label)

      return graph_node

    def enter_composite_transform(self, transform_node):
      if len(transform_node.full_label) == 0:
        # Ignore the root node representing the pipeline itself
        return

      graph_node = self.add_node(transform_node)
      self._node_stack.append(graph_node)

    def leave_composite_transform(self, transform_node):
      if len(transform_node.full_label) == 0:
        # Ignore the root node representing the pipeline itself
        return

      self._node_stack.pop()

    def visit_transform(self, transform_node):
      self.add_node(transform_node)

    def visit(self, pipeline):
      pipeline.visit(self)
      return self._nodes


class LocalCatalog(Catalog):

  def __init__(self, ns):
    super(LocalCatalog, self).__init__()
    self._ns = ns

  def sink(self, name, runtime_sink=None):
    if runtime_sink is not None:
      return super(LocalCatalog, self).sink(name, runtime_sink)

    data = self._ns[name] = list()
    return LocalCatalog.ListSink(data)

  def source(self, name, runtime_source=None):
    if runtime_source is not None:
      return super(LocalCatalog, self).source(name, runtime_source)

    data = self._ns.get(name, None)
    if data is not None:
      if type(data) != list:
        raise TypeError('"%s" does not represent a list' % name)
      return LocalCatalog.ListSource(data)
    else:
      return super(LocalCatalog, self).source(name)

  class ListSource(Source):

    def __init__(self, data):
      self._data = data

    def reader(self):
      return LocalCatalog.ListSource.Reader(self._data)

    class Reader(SourceReader):

      def __init__(self, data):
        self._data = data

      def __enter__(self):
        return self

      def __exit__(self, exception_type, exception_value, traceback):
        pass

      def __iter__(self):
        return self._data.__iter__()

  class ListSink(Source):

    def __init__(self, data):
      self._data = data

    def writer(self):
      return LocalCatalog.ListSink.Writer(self._data)

    class Writer(SinkWriter):

      def __init__(self, data):
        self._data = data

      def __enter__(self):
        return self

      def __exit__(self, exception_type, exception_value, traceback):
        pass

      def Write(self, o):
        self._data.append(o)


class DataflowJSONEncoder(_json.JSONEncoder):

  def default(self, obj):
    if isinstance(obj, BoundedWindow):
      return str(obj)
    else:
      return super(DataflowJSONEncoder, self).default(obj)


class DataflowOptionsParser(_argparse.ArgumentParser):

  def __init__(self):
    super(DataflowOptionsParser, self).__init__(add_help=False, prog='%dataflow run')

  def add_option(self, *args, **kwargs):
    self.add_argument(*args, **kwargs)

  def error(self, message):
    _sys.stderr.write('%s\n%s' % (message, self.format_usage()))
    raise Exception(message)

  def _parse(self, args):
    return self.parse_args(args)


@_magic.register_line_cell_magic
def dataflow(line, cell=None):
  ipy = _ipython.get_ipython()
  ns = ipy.user_ns

  args = filter(None, line.split(' '))
  if args[0] != 'run':
    return

  args = args[1:]

  dataflow = Dataflow(ns)
  try:
    dataflow.run(args)
  except Exception:
    return None

  graph = _json.dumps(dataflow.graph)
  data = _json.dumps(dataflow.data, cls=DataflowJSONEncoder)

  # Markup consists of an <svg> element for graph rendering, a <label> element
  # for describing the selected graph node, and a <div> to contain a table
  # rendering of the selected node's output.
  markup = """
    <svg class="df-pipeline"><g /></svg>
    <label class="df-title"></label>
    <div class="df-data"></div>
    """
  html = _Html(markup)
  html.add_class('df-run')
  html.add_dependency('style!/static/extensions/dataflow.css', 'css')
  html.add_dependency('extensions/dataflow', 'dataflow')
  html.add_script('dataflow.renderPipeline(dom, %s, %s)' % (graph, data))

  return html
