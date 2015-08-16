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

"""Implementation of the python magic"""

import IPython as _ipython
import IPython.core.magic as _magic
from ._commands import CommandParser as _CommandParser
from ._deployment import Deployable as _Deployable
from ._module import ModuleLoader as _ModuleLoader

@_magic.register_line_cell_magic
def python(line, cell=None):
  """Creates and executes python modules.
  """
  parser = _CommandParser.create('python')
  parser.add_argument('-m', '--module',
                      metavar='name',
                      help='optional name of the module to create and import')

  # TODO: Add validation to module name - must be a valid python identifier

  args = parser.parse(line)
  if args is not None:
    if cell is None:
      print 'The python code for the module must be included'
      return

    if hasattr(args, 'module'):
      module_name = str(args.module)
      module = _ModuleLoader.load(cell, module_name)
  
      # Automatically import the newly created module by assigning it to a variable
      # named the same name as the module name.
      ipy = _ipython.get_ipython()
      ipy.push({module_name: module})

      return _Deployable(cell, 'text/module-python')
    else:
      # Create a module and load the code, but don't name store it
      _ModuleLoader.load(cell)
      return None
