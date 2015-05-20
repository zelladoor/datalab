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

"""Test runner functionality"""

import sys as _sys
import unittest as _unittest
import IPython as _ipython
import IPython.core.magic as _magic
from ._commands import CommandParser as _CommandParser


@_magic.register_line_magic
def tests(line):
  parser = _CommandParser.create('tests')
  run_parser = parser.subcommand('run', None, 'runs unit tests that have been defined')

  args = parser.parse(line)
  if args is None:
    return

  try:
    module = _ipython.get_ipython().user_ns.get('tests', None)
    if module is not None:
      suite = _unittest.TestSuite()
      suite.addTests(_unittest.defaultTestLoader.loadTestsFromModule(module))

      runner = _unittest.TextTestRunner(stream=_sys.stdout, verbosity=2)
      result = runner.run(suite)

      print 'Tests Run: %d' % result.testsRun

      if len(result.errors) != 0:
        _sys.stderr.write('Errors:')
        for error in result.errors:
          _sys.stderr.write('\n%s\n%s\n' % error)

      if len(result.failures) != 0:
        _sys.stderr.write('Failures:')
        for failure in result.failures:
          _sys.stderr.write('\n%s\n%s\n' % failure)
    else:
      print 'A module named "tests" was not found.'
  except Exception as e:
    _sys.stderr.write(e.message)
  return None
