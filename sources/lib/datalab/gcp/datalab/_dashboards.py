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

try:
  import IPython as _ipython
  import IPython.core.magic as _magic
except ImportError:
  raise Exception('This module can only be loaded in ipython.')

import json
from ._commands import CommandParser as _CommandParser
from ._utils import _handle_magic_line


# Argument parsers.
def _create_source_subparser(dashboard_parser):
  source_parser = dashboard_parser.subcommand('source',
                              'Define a datasource which can later be used by name in a chart.')
  source_parser.add_argument('-n', '--name', help='The name to be used in the chart context.', required=True)
  source_parser.add_argument('-d', '--data', help='The query to be used as data source.')
  source_parser.add_argument('-del', '--delete', help='Delete an existing data source.', action='store_true')
  return source_parser


def _create_chart_subparser(dashboard_parser):
  chart_parser = dashboard_parser.subcommand('chart',
                              'Define the properties of a chart.')
  chart_parser.add_argument('-n', '--name', help='The name of the chart for later referende.', required=True)
  chart_parser.add_argument('-ty', '--type',
                            choices=['line', 'multi-line',
                                     'pie-chart', 'bar-chart',
                                     'row-chart', 'bubble-chart',
                                     'table'],
                            help='The type of chart.',
                            required=True)
  chart_parser.add_argument('-d', '--data', help='The data source for this chart.', required=True)
  chart_parser.add_argument('-ti', '--title', help='The title of the chart.', required=True)
  chart_parser.add_argument('-ht', '--height', help='The height of the chart, in number of rows.', required=True)
  chart_parser.add_argument('-wi', '--width', help='The width of the chart, in number of columns.', required=True)
  return chart_parser


def _create_publish_subparser(dashboard_parser):
  publish_parser = dashboard_parser.subcommand('publish',
                              'Publish the dashboard.')
  publish_parser.add_argument('-n', '--name', help='The name of the dashboard.')
  publish_parser.add_argument('-b', '--bucket', help='The bucket to save the dashboard in.')
  publish_parser.add_argument('--update',
                                action='store_true',
                                help='Update the named chart with settings in current workspace.')
  return publish_parser


def _create_delete_subparser(dashboard_parser):
  delete_parser = dashboard_parser.subcommand('delete', 'Delete a specific dashboard.')
  delete_parser.add_argument('-n', '--name', help='The name of the dashboard to be deleted.')
  delete_parser.add_argument('-b', '--bucket', help='The Google Cloud Storage bucket which holds the dashboard.')
  return delete_parser


def _create_list_subparser(dashboard_parser):
  list_parser = dashboard_parser.subcommand('list', 'List all dashboards in a specific bucket.')
  list_parser.add_argument('-b', '--bucket')
  return list_parser


# TODO Copied from bigquery, factor out into _util package.
def _dispatch_handler(args, cell, parser, handler,
                      cell_required=False, cell_prohibited=False):
  """ Makes sure cell magics include cell and line magics don't, before dispatching to handler.

  Args:
    args: the parsed arguments from the magic line.
    cell: the contents of the cell, if any.
    parser: the argument parser for <cmd>; used for error message.
    handler: the handler to call if the cell present/absent check passes.
    cell_required: True for cell magics, False for line magics that can't be cell magics.
    cell_prohibited: True for line magics, False for cell magics that can't be line magics.
  Returns:
    The result of calling the handler.
  Raises:
    Exception if the invocation is not valid.
  """
  if cell_prohibited:
    if cell and len(cell.strip()):
      parser.print_help()
      raise Exception('Additional data is not supported with the %s command.' % parser.prog)
    return handler(args)

  if cell_required and not cell:
    parser.print_help()
    raise Exception('The %s command requires additional data' % parser.prog)

  return handler(args, cell)


@_magic.magics_class
class Dashboards(_magic.Magics):
  """
  Class used to parse dashboards commands, and create JSON files
     which can be parsed by the dashboards server.
  """

  # The header used when creating a new dashboard.
  json_template = '{ "settings": { "first_run": true, "authoring_mode": true }}'

  # Code for magics.
  def source_dashboard(self, args):
    name = args['name']
    if not args['data'] and not args['delete']:
      return 'Either -del/--delete or -d/--data DATA need to be specified.'
    elif 'delete' in args and args['delete']:
      del self.sources[name]; # The semi-colon is required to suppress its output.
      return 'Successfully deleted %s.' % name
    else:
      data = args['data']

      self.sources[name] = {'query': data}
      return 'Data source %s: set to "%s"' % (name, data)

  @staticmethod
  def _chart_helper(passed_fields, required_fields):
    missing_fields = []
    for field in required_fields:
      if field not in passed_fields:
        missing_fields.append(field)


  def chart_dashboard(self, args, data):
    # Try parsing the data.
    chart = {'type': args['type'],
             'title': args['title'],
             'data': args['data'],
             'height': args['height'],
             'width': args['width']}
    name = args['name']

    # Parse the data
    data = json.loads(data)

    # Check whether all required fields are present.
    error_string = 'A chart of type %s requires further fields: %s'
    required_fields = None
    optional_fields = None
    if name == 'line':
      required_fields = ['dimension', 'y_field']
      optional_fields = ['labels']
    else:
      # TODO (rnabel) Fill in the other chart types.
      pass

    self._chart_helper(data, required_fields)



    self.charts[args['name']] = chart
    return 'chart_dashboard called with args: "%s", and cell body: %s' % (args, data)

  def publish_dashboards(self, args, data=None):
    sources = json.dumps(self.sources)
    charts = json.dumps(self.charts)
    # Go through each line to update required settings.
    return 'publish_dashboard called, sources:%s, %s' % (sources, charts)

  def delete_dashboard(self, args):
    return 'delete_dashboard called with args: "%s", and cell body: %s' % (args, data)

  def list_dashboard(self, args):
    return 'list_dashboard called with args: "%s", and cell body: %s' % (args, data)

  # Dictionary with the handler methods.
  # handlers = {'source': source_dashboard,
  #             'chart': chart_dashboard,
  #             'publish': publish_dashboards,
  #             'delete': delete_dashboard,
  #             'list': list_dashboard}

  def _create_dashboard_parser(self):
    dashboard_parser = _CommandParser.create('dashboard')

    # %dashboard source
    source_parser = _create_source_subparser(dashboard_parser)
    source_parser.set_defaults(
      func=lambda args, cell: _dispatch_handler(args, cell, source_parser,
                                                self.source_dashboard, cell_prohibited=True))

    # %%dashboard chart
    chart_parser = _create_chart_subparser(dashboard_parser)
    chart_parser.set_defaults(
      func=lambda args, cell: _dispatch_handler(args, cell, chart_parser,
                                                self.chart_dashboard, cell_required=True))
    # %%dashboard publish
    publish_parser = _create_publish_subparser(dashboard_parser)
    publish_parser.set_defaults(
      func=lambda args, cell: _dispatch_handler(args, cell, publish_parser,
                                                self.publish_dashboards, cell_prohibited=True))
    # %%dashboard delete
    delete_parser = _create_delete_subparser(dashboard_parser)
    delete_parser.set_defaults(
      func=lambda args, cell: _dispatch_handler(args, cell, delete_parser,
                                                self.delete_dashboard, cell_prohibited=True))
    # %%dashboard list
    list_parser = _create_list_subparser(dashboard_parser)
    list_parser.set_defaults(
      func=lambda args, cell: _dispatch_handler(args, cell, list_parser,
                                                self.list_dashboard , cell_prohibited=True))
    return dashboard_parser

  # Called by IPython when dashboard magic is eecuted.
  @_magic.line_cell_magic
  def dashboard(self, args, data=None):
    # create the parser
    return _handle_magic_line(args, data, self.parser)

  def __init__(self, shell):
    super(Dashboards, self).__init__(shell)
    self.parser = self._create_dashboard_parser()
      # Fields used to keep the state of the current dashboard.
    self.sources = {}
    self.charts = {}

ip = get_ipython()
ip.register_magics(Dashboards)