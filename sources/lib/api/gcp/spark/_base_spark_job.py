# Copyright 2015 Google Inc. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

"""Common class for Spark Jobs. """

import datetime
import gcp._util
import _api


class BaseSparkJob(Object):
  """Represents a base class for one type of Spark jobs.
  See https://cloud.google.com/dataproc/reference/rest/v1beta1/projects.jobs#Job.
  """

  def __init__(self, cluster_name, context=None):
    """Initializes an instance of a BaseSparkJob.
    Args:
      job_id: the Spark job ID corresponding to this job.
      cluster_name: The name of the cluster where the job is submitted.
      context: a Context object providing project_id and credentials.
    """
    if context is None:
      context = gcp.Context.default()
    self._context = context
    self._api = _api.Api(context)
