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

"""Google Cloud Platform library - Apache Spark/Hardoop jobs functionality."""

import dateutil.parser
import re

import gcp
import gcp._util
import gcp.dataproc._api


class Job(object):
  """Represents an Apache Spark/Hardoop base job."""

  def __init__(self, job_id, info=None, context=None):
    """Initializes an instance of a Job object.
    Args:
      job_id: the id of the job.
      info: the information about the job if available.
      context: an optional Context object providing project_id and credentials. If a specific
          project id or credentials are unspecified, the default ones configured at the global
          level are used.
    """
    if context is None:
      context = gcp.Context.default()
    self._context = context
    self._api = gcp.dataproc._api.Api(context)
    self._job_id = job_id
    self._info = info

  @property
  def job_id(self):
    """The id of the job."""
    return self._job_id

  @property
  def project_id(self):
    return self._info['reference']['projectId'] if 'reference' in self._info else None

  @property
  def cluster_name(self):
    return self._info['placement']['clusterName'] if 'placement' in self._info else None

  @property
  def cluster_uuid(self):
    return self._info['placement']['clusterUuid'] if 'placement' in self._info else None

  @property
  def state(self):
    return  self._info['status']['state'] if 'status' in self._info else None

  @property
  def state_details(self):
    return  self._info['status']['details'] if 'details' in self._info else None

  @property
  def state_start_time(self):
    """The state timestamp of as a datetime.datetime."""
    if 'status' not in self._info:
      return None
    s = self._info['status'].get('stateStartTime', None)
    return dateutil.parser.parse(s) if s else None

  @property
  def driver_output_resource_uri(self):
    return self._info['driverOutputResourceUri'] if 'driverOutputResourceUri' in self._info else None

  @property
  def driver_control_files_uri(self):
    return self._info['driverControlFilesUri'] if 'driverControlFilesUri' in self._info else None

  @property
  def is_complete(self):
    return self.state in ["CANCELLED", "DONE", "ERROR"]

  def __repr__(self):
    """Returns a representation for the table for showing in the notebook.
    """
    if self.exists():
      return 'Job Id:[{job_id}], Status:[{state}]'.format(job_id = self._job_id, state = self.state)
    else:
      return 'Job Id:[{job_id}]'.format(job_id = self._job_id)

  def exists(self):
    """ Checks if the job exists. """
    return self._info is not None

  def create(self, region, project_id=None):
    """Creates the job.
    Args:
      The project in which to create the job.
    Returns:
      The job.
    Raises:
      Exception if there was an error creating the job.
    """
    if not self.exists():
      if project_id is None:
        project_id = self._api.project_id
      try:
        self._info = self._api.jobs_insert(self._name, region, project_id=project_id)
      except Exception as e:
        raise e
    return self

  def delete(self):
    """Deletes the job.
    Raises:
      Exception if there was an error deleting the job.
    """
    if self.exists():
      try:
        self._api.jobs_delete(self._name)
      except Exception as e:
        raise e

class Jobs(object):
  """Represents a list of Apache Spark/Hardoop jobs for a project."""

  def __init__(self, project_id=None, context=None):
    """Initializes an instance of a Jobs object.
    Args:
      project_id: an optional project whose jobs we want to manipulate. If None this
          is obtained from the api object.
      context: an optional Context object providing project_id and credentials. If a specific
          project id or credentials are unspecified, the default ones configured at the global
          level are used.
    """
    if context is None:
      context = gcp.Context.default()
    self._context = context
    self._api = gcp.dataproc._api.Api(context)
    self._project_id = project_id if project_id else self._api.project_id

  def contains(self, job_id):
    """Checks if the specified job exists.
    Args:
      name: the name of the job to lookup.
    Returns:
      True if the job exists; False otherwise.
    Raises:
      Exception if there was an error requesting information about the job.
    """
    return self.get(job_id) != None

  def get(self, job_id):
    try:
      info = self._api.jobs_get(job_id)
      return Job(info['reference']['jobId'], info, context=self._context)
    except gcp._util.RequestException as e:
      if e.status == 404:
        return None
      raise e
    except Exception as e:
      raise e
    return None

  def create(self, name, region):
    """Creates a new job.
    Args:
      name: a unique name for the new job.
    Returns:
      The newly created job.
    Raises:
      Exception if there was an error creating the job.
    """
    return Job(name, context=self._context).create(self._project_id, region)

  def _retrieve_jobs(self, page_token, _):
    try:
      list_info = self._api.jobs_list(page_token=page_token, project_id=self._project_id)
    except Exception as e:
      raise e

    jobs = list_info.get('jobs', [])
    if len(jobs):
      try:
        jobs = [Job(info['reference']['jobId'], info, context=self._context) for info in jobs]
      except KeyError:
        raise Exception('Unexpected response from server')

    page_token = list_info.get('nextPageToken', None)
    return jobs, page_token

  def __iter__(self):
    return iter(gcp._util.Iterator(self._retrieve_jobs))
