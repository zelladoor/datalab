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

"""Implements Catalog functionality."""

class Catalog(object):
  """A set of named sources and sinks for use in a dataflow pipeline.
  """

  def __init__(self):
    """Initializes an instance of a Catalog.
    """
    self._sinks = {}
    self._sources = {}

  def sink(self, name, sink=None):
    """Adds or retrieves the named sink implementation.

    Args:
      name: the name of the sink to add or retrieve.
      sink: the sink implementation to associate with the specified name.
    Returns:
      The sink associated with the specified name.
    """
    if sink is not None:
      self._sinks[name] = sink
    return self._sinks[name]

  def source(self, name, source=None):
    """Adds or retrieves the named source implementation.

    Args:
      name: the name of the source to add or retrieve.
      source: the source implementation to associate with the specified name.
    Returns:
      The source associated with the specified name.
    """
    if source is not None:
      self._sources[name] = source
    return self._sources[name]
