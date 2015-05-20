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

"""Implements decorators that define a dataflow."""

from ._catalog import Catalog as _Catalog

class Source(object):

  def __init__(self, name, source):
    self._name = name
    self._source = source

  def __call__(self, fn):
    catalog = None
    if hasattr(fn, 'catalog'):
      catalog = fn.catalog
    else:
      catalog = _Catalog()
      fn.catalog = catalog

    catalog.sources.add(self._name, self._source)
    return fn


class Sink(object):

  def __init__(self, name, sink):
    self._name = name
    self._sink = sink

  def __call__(self, fn):
    catalog = None
    if hasattr(fn, 'catalog'):
      catalog = fn.catalog
    else:
      catalog = _Catalog()
      fn.catalog = catalog

    catalog.sinks.add(self._name, self._sink)
    return fn


class Argument(object):

  def __init__(self, *args, **kwargs):
    self._arg = (args, kwargs)

  def __call__(self, fn):
    args = None
    if hasattr(fn, 'args'):
      args = fn.args
    else:
      args = list()
      fn.args = args

    args.append(self._arg)
    return fn
