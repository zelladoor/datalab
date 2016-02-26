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

  def jobs_list(self):
    url = Api._ENDPOINT + Api._JOBS_PATH.format(project_id=self._project_id)
    return gcp._util.Http.request(url, '', credentials=self._credentials)

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
