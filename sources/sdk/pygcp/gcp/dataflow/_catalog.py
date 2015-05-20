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

"""Implements a user populated catalog."""

import google.cloud.dataflow as _df

# TODO: CatalogSet should take in a base class to validate what is added

class CatalogSet(object):

  def __init__(self):
    self._items = dict()

  @property
  def names(self):
    return self._items.keys()

  def add(self, name, value):
    self._items[name] = value

  def get(self, name):
    return self._items[name]


class Catalog(object):

  def __init__(self):
    self.sources = CatalogSet()
    self.sinks = CatalogSet()
