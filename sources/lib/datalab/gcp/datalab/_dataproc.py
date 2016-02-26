# Copyright 2015 Google Inc. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

"""Google Cloud Platform library - DataProc IPython Functionality."""

import fnmatch
import re

import gcp
import gcp.dataproc.clusters
import _commands
import _html
import _utils

try:
  import IPython
  import IPython.core.display
  import IPython.core.magic
except ImportError:
  raise Exception('This module can only be loaded in ipython.')


@IPython.core.magic.register_line_magic
def dataproc(line):
  """Implements the dataproc line magic for ipython notebooks.
  Args:
    line: the contents of the dataproc line.
  Returns:
    The results of executing the cell.
  """
  parser = _commands.CommandParser(prog='dataproc', description="""
Execute various dataproc-related operations. Use "%dataproc <command> -h"
for help on a specific command.
""")

  clusters_parser = parser.subcommand('clusters',
                                      'Clusters related operations.')
  clusters_list_parser = clusters_parser.subcommand('list',
                                                    'List clusters in a project.')
  clusters_list_parser.add_argument('-p', '--project', help='The project associated with the objects')
  clusters_list_parser.set_defaults(func=_clusters_list)


  return _utils.handle_magic_line(line, None, parser)


def _parser_exit(status=0, message=None):
  """ Replacement exit method for argument parser. We want to stop processing args but not
      call sys.exit(), so we raise an exception here and catch it in the call to parse_args.
  """
  raise Exception()

def _clusters_list(args, _):
  project = args['project']

  print 'dataproc list clusters, project:{0}'.format(project)
  clusters = gcp.dataproc.clusters.Clusters()
  return clusters.list()
