# Copyright 2015 Google Inc. All rights reserved.
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

"""Represents a Column constraint in a Query."""

import json

class Constraint(object):

  def __init__(self, operand, operation, representation):
    self._operand = operand
    self._operation = operation
    self._representation = representation

  def _bin_constraint(self, name, format, other):
    if isinstance(other, basestring):
      other = json.dumps(other)
    return BinaryConstraint(self, name, other, format % (self, other))

  def __repr__(self):
    return self._representation

  def __and__(self, other):
    return self._bin_constraint('and', '%s AND %s', other)

  def __gt__(self, other):
    return self._bin_constraint('gt', '%s > %s', other)

  def __ge__(self, other):
    return self._bin_constraint('ge', '%s >= %s', other)

  def __lt__(self, other):
    return self._bin_constraint('lt', '%s < %s', other)

  def __le__(self, other):
    return self._bin_constraint('le', '%s <= %s', other)

  def __eq__(self, other):
    return self._bin_constraint('eq', '%s = %s', other)

  def __ne__(self, other):
    return self._bin_constraint('ne', '%s <> %s', other)

class BinaryConstraint(Constraint):

  def __init__(self, operand1, operation, operand2, representation):
    super(BinaryConstraint, self).__init__(operand1, operation, representation)
    self._operand2 = operand2

