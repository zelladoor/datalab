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

"""Implementation of the code magic"""

import sys as _sys
import types as _types
import IPython as _ipython
import IPython.core.magic as _magic
from ._commands import CommandParser as _CommandParser

ANONYMOUS_MODULE_NAME = '__anonymous'

@_magic.register_line_cell_magic
def code(line, cell=None):
  """Creates and executes code modules.
  """
  parser = _CommandParser.create('code')
  parser.add_argument('-m', '--module',
                      metavar='name',
                      help='optional name of the module to create and import')

  args = parser.parse(line)
  if args is not None:
    if cell is None:
      print 'The code for the module must be specified'
      return

    if hasattr(args, 'module'):
      module_name = str(args.module)
      module = _create_module(cell, module_name)
  
      # Automatically import the newly created module by assigning it to a variable
      # named the same name as the module name.
      ipy = _ipython.get_ipython()
      ipy.push({module_name: module})
    else:
      # Create a module and load the code, but don't name store it
      _create_module(cell)

def _create_module(code, name=None):
  anonymous = name is None
  if anonymous:
    name = ANONYMOUS_MODULE_NAME

  # By convention the module is associated with a file name matching the module name
  module = _types.ModuleType(name)
  module.__file__ = name
  module.__name__ = name

  exec code in module.__dict__

  # Hold on to the module if the code executed successfully
  if not anonymous:
    _sys.modules[name] = module
    return module

  return None
