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

"""Implementation of module functionality"""

import sys as _sys
import types as _types

_ANONYMOUS_MODULE_NAME = '__anonymous'

class ModuleLoader(object):
  """Loads modules dynamically.
  """

  @staticmethod
  def load(code, name=None):
    """Creates a module with the specified code, and optional name.
    """
    anonymous = name is None
    if anonymous:
      name = _ANONYMOUS_MODULE_NAME
  
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
