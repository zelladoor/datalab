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

import json as _json
import google.cloud.dataflow as df
import IPython as _ipython
import IPython.core.magic as _magic
from ._html import Html as _Html


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

class DataflowJSONEncoder(_json.JSONEncoder):

  def default(self, obj):
    if isinstance(obj, df.window.BoundedWindow):
      return str(obj)
    else:
      return super(DataflowJSONEncoder, self).default(obj)


def _repr_html_pipeline(pipeline):
  graph = _json.dumps(DataflowGraphBuilder().visit(pipeline))
  data = _json.dumps(DataflowDataCollector().visit(pipeline), cls=DataflowJSONEncoder)

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

def _register_html_formatters():
  ipy = _ipython.get_ipython()
  html_formatter = ipy.display_formatter.formatters['text/html']

  html_formatter.for_type_by_name('google.cloud.dataflow.pipeline', 'Pipeline',
                                  _repr_html_pipeline)


_register_html_formatters()
