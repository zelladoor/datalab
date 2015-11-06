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

"""Implements Spark Job functionality."""

import datetime
import gcp._util
import _api


class Job(gcp._util.Job):
  """Represents a Spark Job.
  See https://cloud.google.com/dataproc/reference/rest/v1beta1/projects.jobs#Job.
  """

  def __init__(self, job_id, cluster_name, context):
    """Initializes an instance of a Job.
    Args:
      job_id: the Spark job ID corresponding to this job.
      cluster_name: The name of the cluster where the job is submitted.
      context: a Context object providing project_id and credentials.
    """
    super(Job, self).__init__(job_id)
    self._context = context
    self._api = _api.Api(context)
    self._cluster_name = cluster_name
    self._start_time = None
    self._end_time = None

  def __repr__(self):
    """Returns a representation for the job for showing in the notebook.
    """
    return 'Job %s, Cluster %s' % self._job_id, self._cluster_name

  @property
  def start_time_utc(self):
    """ The UTC start time of the job as a Python datetime. """
    return self._start_time

  @property
  def end_time_utc(self):
    """ The UTC end time of the job (or None if incomplete) as a Python datetime. """
    return self._end_time

  @property
  def total_time(self):
    """ The total time in fractional seconds that the job took, or None if not complete. """
    if self._end_time is None:
      return None
    return (self._end_time - self._start_time).total_seconds()

  def _refresh_state(self):
    """ Get the state of a job. If the job is complete this does nothing;
        otherwise it gets a refreshed copy of the job resource.
    """
    if self._is_complete:
      return

    try:
      response = self._api.jobs_get(self._job_id)
    except Exception as e:
      raise e

    if 'status' in response:
      status = response['status']
      if 'state' in status:
        state = status['state']
        if state == 'DONE':
          self._is_complete = True
        if state == 'ERROR':
          self._is_complete = True
          message = ''
          if 'details' in status:
            message = status['details']
          self._fatal_error = gcp._util.JobError('', message, '')
