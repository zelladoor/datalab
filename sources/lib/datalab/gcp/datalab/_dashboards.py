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
from jsonmerge import merge
import requests
from ._commands import CommandParser as _CommandParser
from ._utils import _handle_magic_line
import gcp.bigquery as bq
import gcp.storage as gcs


# Argument parsers.
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
  publish_parser.add_argument('-n', '--name', help='The name of the dashboard.', required=True)
  publish_parser.add_argument('-b', '--bucket', help='The bucket to save the dashboard in.', required=True)
  publish_parser.add_argument('-t', '--title', help='The title to be shown at the top of the dashboard panel.')
  publish_parser.add_argument('--update',
                              action='store_true',
                              help='Update the named chart with settings in current workspace.',
                              default=False)
  publish_parser.add_argument('-bc', '--bcolor', help='The CSS colour value of the background of the dashboard')
  return publish_parser

def _create_reset_subparser(dashboard_parser):
  return dashboard_parser.subcommand('reset', 'Resets the internal state.')

def _create_delete_subparser(dashboard_parser):
  delete_parser = dashboard_parser.subcommand('delete', 'Delete a specific dashboard.')
  delete_parser.add_argument('-n', '--name', help='The name of the dashboard to be deleted.', required=True)
  delete_parser.add_argument('-b', '--bucket', help='The Google Cloud Storage bucket which holds the dashboard.', required=True)
  return delete_parser


def _create_list_subparser(dashboard_parser):
  list_parser = dashboard_parser.subcommand('list', 'List all dashboards in a specific bucket.')
  list_parser.add_argument('-b', '--bucket', required=True)
  return list_parser


# Helper functions.
def _get_available_servers(bucket):
  av_servers_item = gcs.item(bucket, 'available_servers.txt')
  av_servers = []
  if av_servers_item.exists():
    av_servers = av_servers_item.read_from().split('\n')
  return av_servers


def _send_request_to_dash_servers(servers, dashboard_name):
  successful = []

  for server in servers:
    url = 'http://' + server + '/dashboards/' + dashboard_name
    try:
      r = requests.get(url)
      if r.status_code == 200:
        successful.append(url)
    except requests.ConnectionError as msg:
      pass

  return successful


# TODO Copied from bigquery, factor out into _util.
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

  @staticmethod
  def _chart_helper(passed_fields, required_fields):
    missing_fields = []
    for field in required_fields:
      if field not in passed_fields:
        missing_fields.append(field)

    return missing_fields

  def chart_dashboard(self, args, data):
    # Try parsing the data.
    chart = {'type': args['type'],
             'title': args['title'],
             'data': args['data'],
             'height': args['height'],
             'width': args['width']}
    # Name of the chart.
    name = args['name']
    # Data source of the chart. A BigQuery variable.
    source = args['data']

    # Check if the BQ variable is defined.
    ipy = _ipython.get_ipython()
    query_obj = ipy.user_ns.get(source, None)
    if not isinstance(query_obj, bq._query.Query):
      return "Error: the passed data string is not a BigQuery query."

    self.sources[source] = {'query': query_obj._sql.strip()}

    try:
      data = json.loads(str(data), strict=False)
    except ValueError as e:
      return 'Could not parse the provided chart settings as it does not conform with the JSON specification. ' \
             'Further information: \n' + e.message

    # Create in-line dictionary, pass it the chart type, returns required and optional settings.
    required_fields, optional_fields = {
      'line': (
        ['dimension', 'group'],
        ['labels', 'colors', 'color_domain', 'elasticX', 'elasticY', 'y_axis_padding', 'x_axis_padding', 'label_function', 'title_function', 'yaxis_tick_format_function', 'xaxis_tick_format_function', 'value_accessor', 'margins']),

      'multi-line': (['dimension', 'group'], ['labels']),

      'pie-chart': (['dimension'], ['innerRadius']),

      'bar-chart': (['dimension'], ['margins', 'elasticY', 'x_interval', 'round', 'centralBar']),

      'row-chart': (['dimension', 'margins'], ['chart-label', 'chart-title', 'elasticX', 'ticks']),

      'bubble-chart': (
        ['dimension', 'group', 'margins', 'key_accessor', 'value_accessor', 'rad_val_accessor'],
        ['labels', 'max_rel_bubble_size', 'colors', 'color_domain', 'elasticX', 'elasticY', 'y_axis_padding', 'x_axis_padding', 'label_function', 'title_function', 'yaxis_tick_format_function', 'xaxis_tick_format_function', 'y_interval', 'x_interval']),

      "table": (["dimension", "group"], [])
    }[chart['type']]

    # Check if any fields are missing.
    missing_fields = self._chart_helper(data.keys(), required_fields)
    if len(missing_fields):
      return 'The following fields need to be specified in the cell body: %s' % '"' + '", "'.join(missing_fields) + '"'

    # Set the required and optional fields.
    self.charts[name] = chart

    for field in optional_fields + required_fields:
      if field in data.keys():
        self.charts[name][field] = data[field]

    # return 'Created chart: %s' % json.dumps(self.charts[name])
    return 'Successfully created chart of type %s.' % args['type']

  def publish_dashboards(self, args, data=None):
    dash_name = args['name']
    bucket_name = args['bucket']
    title = args['title']

    head = dict()
    head['data_sources'] = self.sources
    head['charts'] = self.charts

    if title:
      head['settings'] = dict()
      head['settings']['title'] = title

    # TODO (rnabel) Remove authoring mode.
    gcs_item = gcs.item(bucket_name, dash_name)
    do_update = args['update']

    if do_update and gcs_item.exists():
      existing_file = gcs_item.read_from()
      base = json.loads(existing_file)

    elif do_update:
      return 'Error, can not update charts as the specified dashboard does not exist.'

    else:
      base = json.loads(self.json_template)

    # Merge old and new settings.
    output = merge(base, head)
    # Stringify the different settings.
    output = json.dumps(output)

    # Upload to GCS.
    gcs_item.write_to(output, "text/plain")

    # Request the page and return link
    servers = _get_available_servers(bucket_name)
    servers = _send_request_to_dash_servers(servers, dash_name)
    return "Available servers: " + str(servers)

  @staticmethod
  def delete_dashboard(args):
    name = args['name']
    bucket = args['bucket']

    gcs_item = gcs.item(bucket, name)
    if gcs_item.exists():
      gcs_item.delete()
      return 'Successfully deleted %s' % name
    else:
      return 'Could not delete %s, as dashboard does not exist' % name

  @staticmethod
  def list_dashboard(args):
    bucket = args['bucket']
    bucket_obj = gcs.bucket(bucket)

    if bucket_obj.exists():
      list = []
      for element in bucket_obj.items():
        list.append(element.key)

      # list = '"' + '", \n"'.join(list) + '"'
      return list

    else:
      return "Error: the bucket does not exist."

  def reset_dashboard(self, args):
    self.charts = {}
    self.sources = {}
    return 'Reset internal state.'

  def _create_dashboard_parser(self):
    dashboard_parser = _CommandParser.create('dashboard')

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

    # %dashboard reset
    reset_parser = _create_reset_subparser(dashboard_parser)
    reset_parser.set_defaults(
      func=lambda args, cell: _dispatch_handler(args, cell, list_parser,
                                                self.reset_dashboard , cell_prohibited=True)
    )
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