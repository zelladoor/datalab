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

from google.cloud.dataflow import *
from ._decorators import Argument as arg
from ._decorators import Sink as sink
from ._decorators import Source as source

def _pcollection_write(self, label, sink):
  return self.apply(Write(label, sink))
pvalue.PCollection.write = _pcollection_write
