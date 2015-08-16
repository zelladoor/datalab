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

"""Implementation of deployment related functionality."""

import json as _json

class Deployable(object):

  def __init__(self, text, mime):
    self._text = text
    self._mime = mime

  def __repr__(self):
    return ''

  def _repr_json_(self):
    return _json.dumps({'moduleType': self._mime, 'moduleText': self._text})
