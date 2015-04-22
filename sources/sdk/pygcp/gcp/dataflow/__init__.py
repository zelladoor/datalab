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

"""Google Cloud Platform library - Dataflow Functionality."""

from cloud.dataflow.pvalue import PCollection
from cloud.dataflow.pvalue import PValue
from cloud.dataflow.io.fileio import TextFileSource
from cloud.dataflow.io.fileio import TextFileSink
from cloud.dataflow.transforms.combiners import Count
from cloud.dataflow.transforms.combiners import Mean
from cloud.dataflow.transforms.combiners import Top
from cloud.dataflow.transforms.core import GroupByKey
from cloud.dataflow.transforms.core import Map
from cloud.dataflow.transforms.core import ParDo
from cloud.dataflow.transforms.core import PTransform
from cloud.dataflow.transforms.core import Write

from ._catalog import Catalog

def _pvalue_write(self, label, sink):
  return self.apply(Write(label, sink))
PValue.write = _pvalue_write
