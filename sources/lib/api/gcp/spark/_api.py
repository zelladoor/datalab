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

"""Implements Spark HTTP API wrapper."""

import gcp
import gcp._util


class Api(object):
  """A helper class to issue BigQuery HTTP requests."""

  # TODO(nikhilko): Use named placeholders in these string templates.
  # TODO(gram): Remove default params from this class's methods.
  _ENDPOINT = 'https://dataproc.googleapis.com/v1beta1'
  _JOBS_PATH = '/projects/%s/jobs'

  def __init__(self, context):
    """Initializes the BigQuery helper with context information.
    Args:
      context: a Context object providing project_id and credentials.
    """
    self._credentials = context.credentials
    self._project_id = context.project_id

  @property
  def project_id(self):
    """The project_id associated with this API client."""
    return self._project_id

  def jobs_list(self, project_id=None, page_size=0, page_token=None,
                cluster_name=None):
    if project_id is None:
      project_id = self._project_id
    url = Api._ENDPOINT + (Api._JOBS_PATH % (project_id))

    args = {}
    if page_size != 0:
      args['page_size'] = page_size
    if page_token is not None:
      args['pageToken'] = page_token
    if cluster_name is not None:
      args['clusterName'] = cluster_name

    return gcp._util.Http.request(url, args=args, credentials=self._credentials)
