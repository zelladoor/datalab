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

"""Implements Dataproc HTTP API wrapper."""

import urllib
import gcp._util

class Api(object):
  """A helper class to issue Storage HTTP requests."""

  _ENDPOINT = 'https://dataproc.googleapis.com/v1beta1' # TODO(alekseyv): switch it to V1 API
  _CLUSTERS_PATH = '/projects/{project_id}/clusters/'
  _CLUSTER_PATH = _CLUSTERS_PATH + '{cluster_name}'
  _JOBS_PATH = '/projects/{project_id}/jobs'
  _JOB_PATH = _JOBS_PATH + '/{job_id}'

  _MAX_RESULTS = 100

  def __init__(self, context):
    """Initializes the Dataproc helper with context information.
    Args:
      context: a Context object providing project_id and credentials.
    """
    self._credentials = context.credentials
    self._project_id = context.project_id

  @property
  def project_id(self):
    """The project_id associated with this API client."""
    return self._project_id

  def clusters_list(self):
    url = Api._ENDPOINT + Api._CLUSTERS_PATH.format(project_id=self._project_id)
    return gcp._util.Http.request(url, '', credentials=self._credentials)

  def clusters_get(self, cluster_name):
    url = Api._ENDPOINT + Api._CLUSTER_PATH.format(project_id=self._project_id,
                                                   cluster_name=cluster_name)
    return gcp._util.Http.request(url, '', credentials=self._credentials)

  def clusters_insert(self, cluster_name, region, project_id=None):
    """Issues a request to create a new cluster. - does not work yet
    Args:
      cluster_name: the name of the cluster.
      region: the region of the cluster.
      project_id: the project to use when inserting the cluster.
    Returns:
      A parsed cluster information dictionary.
    Raises:
      Exception if there is an error performing the operation.
    """
    project_id = project_id if project_id else self._project_id
    data = {
        "projectId": project_id,
        "clusterName": cluster_name,
        "configuration": {
            object(ClusterConfiguration) # TODO(alekseyv): add more parameters
        },
    }

    url = Api._ENDPOINT + Api._CLUSTERS_PATH.format(project_id=self._project_id)
    return gcp._util.Http.request(url, data=data, credentials=self._credentials)

  def clusters_delete(self, cluster_name):
    """Issues a request to delete a cluster.
    Args:
      cluster_name: the name of the cluster.
      projection: the projection of the cluster information to retrieve.
    Raises:
      Exception if there is an error performing the operation.
    """
    url = Api._ENDPOINT + Api._CLUSTER_PATH.format(project_id=self._project_id,
                                                   cluster_name=cluster_name)
    gcp._util.Http.request(url, method='DELETE', credentials=self._credentials, raw_response=True)



  def jobs_list(self, max_results=0, cluster_name=None, page_token=None, project_id=None):
    """Issues a request to retrieve the list of buckets.
    Args:
      projection: the projection of the bucket information to retrieve.
      max_results: an optional maximum number of objects to retrieve.
      page_token: an optional token to continue the retrieval.
      project_id: the project whose buckets should be listed.
    Returns:
      A parsed list of bucket information dictionaries.
    Raises:
      Exception if there is an error performing the operation.
    """
    if max_results == 0:
      max_results = Api._MAX_RESULTS

    args = {'pageSize': max_results}
    if cluster_name is not None:
      args['clusterName'] = cluster_name
    if page_token is not None:
      args['pageToken'] = page_token

    url = Api._ENDPOINT + Api._JOBS_PATH.format(project_id=self._project_id)
    return gcp._util.Http.request(url, args=args, credentials=self._credentials)


  def jobs_get(self, job_id):
    url = Api._ENDPOINT + Api._JOB_PATH.format(project_id=self._project_id,
                                               job_id=job_id)
    return gcp._util.Http.request(url, '', credentials=self._credentials)

  def WaitForJobTermination(
      job_id,
      context,
      message,
      goal_state,
      stream_driver_log=False,
      log_poll_period_s=1,
      dataproc_poll_period_s=10,
      timeout_s=None):
    """Poll dataproc Job until its status is terminal or timeout reached.

    Args:
      job: The job to wait to finish.
      context: dict, dataproc Command context.
      message: str, message to display to user while polling.
      goal_state: JobStatus.StateValueValuesEnum, the state to define success
      stream_driver_log: bool, Whether to show the Job's driver's output.
      log_poll_period_s: number, delay in seconds between checking on the log.
      dataproc_poll_period_s: number, delay in seconds between requests to
          the Dataproc API.
      timeout_s: number, time out for job completion. None means no timeout.

    Returns:
      Operation: the return value of the last successful operations.get
      request.

    """
    driver_log_stream = None
    last_job_poll_time = 0
    job_complete = False
    wait_display = None

    def ReadDriverLogIfPresent():
      if driver_log_stream and driver_log_stream.open:
        # TODO(pclay): Don't read all output.
        driver_log_stream.ReadIntoWritable(log.err)

    while not timeout_s or timeout_s > (now - start_time):
      # Poll logs first to see if it closed.
      ReadDriverLogIfPresent()
      log_stream_closed = driver_log_stream and not driver_log_stream.open
      if not job_complete and job.status.state in constants.TERMINAL_JOB_STATES:
        job_complete = True
        # Wait an 10s to get trailing output.
        timeout_s = now - start_time + 10

      if job_complete and (not stream_driver_log or log_stream_closed):
        # Nothing left to wait for
        break

      regular_job_poll = (
          not job_complete
          # Poll less frequently on dataproc API
          and now >= last_job_poll_time + dataproc_poll_period_s)
      # Poll at regular frequency before output has streamed and after it has
      # finished.
      expecting_output_stream = stream_driver_log and not driver_log_stream
      expecting_job_done = not job_complete and log_stream_closed
      if regular_job_poll or expecting_output_stream or expecting_job_done:
        last_job_poll_time = now
        try:
          job = self.jobs_get(job_id)
          if (stream_driver_log
              and not driver_log_stream
              and job.driverOutputResourceUri):
            driver_log_stream = storage_helpers.StorageObjectSeriesStream(
                job.driverOutputResourceUri)
        except apitools_exceptions.HttpError as error:
          log.warn('GetJob failed:\n%s', error)
          # Keep trying until we timeout in case error is transient.
      time.sleep(log_poll_period_s)
      now = time.time()

    state = job.status.state
    if state is not goal_state and job.status.details:
      # Just log details, because the state will be in the error message.
      log.info(job.status.details)

    if state in constants.TERMINAL_JOB_STATES:
      if stream_driver_log:
        if not driver_log_stream:
          log.warn('Expected job output not found.')
        elif driver_log_stream.open:
          log.warn('Job terminated, but output did not finish streaming.')
      if state is goal_state:
        return job
      raise Error(
          'Job [{0}] entered state [{1}] while waiting for [{2}].'.format(
              job_ref.jobId, state, goal_state))
    raise Error (
        'Job [{0}] timed out while in state [{1}].'.format(
            job_ref.jobId, state))
