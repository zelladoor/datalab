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

"""Google Cloud Platform library - Dataflow IPython Functionality."""

import inspect as _inspect
import json as _json
import sys as _sys
import IPython as _ipython
import IPython.core.magic as _magic
from ._commands import CommandParser as _CommandParser
from ._html import Html as _Html

import gcp.dataflow as df


class DataflowDataCollector(df.pipeline.PipelineVisitor):

  def __init__(self):
    self._data = dict()

  def visit_value(self, value, producer_node):
    if type(value) == df.pvalue.PCollection:
      items = list(value.get())
      collection = {
        'count': len(items),
        'data': items[:25]
      }

      self._data[producer_node.full_label] = collection

  def visit(self, pipeline):
    pipeline.visit(self)
    return self._data


class DataflowGraphBuilder(df.pipeline.PipelineVisitor):

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


class DataflowLocalCatalog(object):

  def __init__(self, catalog, ns, args):
    self.sources = dict()
    self.sinks = dict()

    if catalog is not None:
      for name in catalog.sources.names:
        source = catalog.sources.get(name)
        if callable(source):
          source = source(args)
        self._add_source(name, source, ns)

      for name in catalog.sinks.names:
        self._add_sink(name, ns)

  def _add_sink(self, name, ns):
    data = ns[name] = list()
    self.sinks[name] = DataflowLocalCatalog.ListSink(data)

  def _add_source(self, name, source, ns):
    data = ns.get(name, None)
    if data is not None:
      if type(data) != list:
        raise TypeError('"%s" does not represent a list' % name)
      source = DataflowLocalCatalog.ListSource(data)

    self.sources[name] = source

  class ListSource(df.io.iobase.Source):

    def __init__(self, data):
      self._data = data

    def reader(self):
      return DataflowLocalCatalog.ListSource.Reader(self._data)

    class Reader(df.io.iobase.SourceReader):

      def __init__(self, data):
        self._data = data

      def __enter__(self):
        return self

      def __exit__(self, exception_type, exception_value, traceback):
        pass

      def __iter__(self):
        return self._data.__iter__()

  class ListSink(df.io.iobase.Sink):

    def __init__(self, data):
      self._data = data

    def writer(self):
      return DataflowLocalCatalog.ListSink.Writer(self._data)

    class Writer(df.io.iobase.SinkWriter):

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
    if isinstance(obj, df.window.BoundedWindow):
      return str(obj)
    else:
      return super(DataflowJSONEncoder, self).default(obj)


class Dataflow(object):

  def __init__(self, dataflow_method, ns):
    self._create_dataflow = dataflow_method
    self._ns = ns

    self._catalog = dataflow_method.catalog if hasattr(dataflow_method, 'catalog') else None
    self._args = dataflow_method.args if hasattr(dataflow_method, 'args') else None

  @staticmethod
  def from_namespace(ns):
    module = ns.get('dataflow', None)
    if module is None:
      raise Exception('A module named "dataflow" was not found in this notebook.')

    dataflow_method = module.__dict__.get('dataflow', None)
    if ((dataflow_method is None) or not callable(dataflow_method) or
        (len(_inspect.getargspec(dataflow_method)[0]) != 3)):
      raise Exception('The dataflow module defined does not contain a ' +
                      '"dataflow(pipeline, catalog, args)" method.')

    return Dataflow(dataflow_method, ns)

  def execute(self, command_line):
    parser = _CommandParser.create('dataflow')

    run_parser = parser.subcommand('run', self._run, 'runs the dataflow')
    run_parser.add_argument('--execution', choices=['local', 'remote'], default='local',
                            help='whether the dataflow should be executed locally or remotely')
    if self._args is not None:
      for args, kwargs in self._args:
        run_parser.add_argument(*args, **kwargs)

    args = parser.parse(command_line)
    if args is not None:
      return args.func(args)

  def _run(self, args):
    args = vars(args)

    runner = df.runners.DirectPipelineRunner()
    pipeline = df.Pipeline(runner)

    self._create_dataflow(pipeline,
                          DataflowLocalCatalog(self._catalog, self._ns, args),
                          args)
    pipeline.run()
    return pipeline


@_magic.register_line_cell_magic
def dataflow(line, cell=None):
  try:
    dataflow = Dataflow.from_namespace(_ipython.get_ipython().user_ns)
    return dataflow.execute(line)
  except Exception as e:
    _sys.stderr.write(e.message)
    return None


def _pipeline_repr_html_(self):
  graph = _json.dumps(DataflowGraphBuilder().visit(self))
  data = _json.dumps(DataflowDataCollector().visit(self), cls=DataflowJSONEncoder)

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

  return html._repr_html_()

def _pipeline_repr_str_(self):
  return ''

df.Pipeline._repr_html_ = _pipeline_repr_html_
df.Pipeline._repr_str_ = _pipeline_repr_str_
