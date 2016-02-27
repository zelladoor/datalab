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

"""Google Cloud Platform library - Apache Spark/Hardoop clusters functionality."""

import dateutil.parser
import re

import gcp
import gcp._util
import gcp.dataproc._api


class ClusterMetadata(object):
  """Represents metadata about an Apache Spark/Hardoop cluster."""

  def __init__(self, info):
    """Initializes an instance of a ClusterMetadata object.
    Args:
      info: a dictionary containing information about an Item.
    """
    self._info = info

  @property
  def name(self):
    """The name of the cluster."""
    return self._info['clusterName']

  @property
  def uuid(self):
    return  self._info['clusterUuid']

  @property
  def state(self):
    return  self._info['status']['state']

  @property
  def zone_uri(self):
    return self._info['zoneUri']

  @property
  def state_start_time(self):
    """The state timestamp of as a datetime.datetime."""
    s = self._info['status'].get('stateStartTime', None)
    return dateutil.parser.parse(s) if s else None

  @property
  def configuration(self):
    return  self._info['configuration']

  @property
  def master_configuration(self):
    return  self._info['masterConfiguration']

  @property
  def software_configuration(self):
    return  self._info['softwareConfiguration']

  @property
  def worker_configuration(self):
    return  self._info['workerConfiguration']

  @property
  def status_history(self):
    return  self._info['statusHistory']


class Cluster(object):
  """Represents an Apache Spark/Hardoop cluster."""

  def __init__(self, name, info=None, context=None):
    """Initializes an instance of a Cluster object.
    Args:
      name: the name of the cluster.
      info: the information about the cluster if available.
      context: an optional Context object providing project_id and credentials. If a specific
          project id or credentials are unspecified, the default ones configured at the global
          level are used.
    """
    if context is None:
      context = gcp.Context.default()
    self._context = context
    self._api = gcp.dataproc._api.Api(context)
    self._name = name
    self._info = info

  @property
  def name(self):
    """The name of the cluster."""
    return self._name

  def __repr__(self):
    """Returns a representation for the table for showing in the notebook.
    """
    return 'Cluster %s' % self._name

  # TODO(alekseyv): I think that metadata properties should be moved into cluster class
  def metadata(self):
    """Retrieves metadata about the cluster.
    Returns:
      A ClusterMetadata instance with information about this cluster.
    Raises:
      Exception if there was an error requesting the cluster's metadata.
    """
    if self._info is None:
      try:
        self._info = self._api.clusters_get(self._name)
      except Exception as e:
        raise e

    return ClusterMetadata(self._info) if self._info else None

  def exists(self):
    """ Checks if the cluster exists. """
    try:
      return self.metadata() is not None
    except Exception:
      return False

  def create(self, region, project_id=None):
    """Creates the cluster.
    Args:
      The project in which to create the cluster.
    Returns:
      The cluster.
    Raises:
      Exception if there was an error creating the cluster.
    """
    if not self.exists():
      if project_id is None:
        project_id = self._api.project_id
      try:
        self._info = self._api.clusters_insert(self._name, region, project_id=project_id)
      except Exception as e:
        raise e
    return self

  def delete(self):
    """Deletes the cluster.
    Raises:
      Exception if there was an error deleting the cluster.
    """
    if self.exists():
      try:
        self._api.clusters_delete(self._name)
      except Exception as e:
        raise e


class Clusters(object):
  """Represents a list of Apache Spark/Hardoop clusters for a project."""

  def __init__(self, project_id=None, context=None):
    """Initializes an instance of a Clusters object.
    Args:
      project_id: an optional project whose clusters we want to manipulate. If None this
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

  def contains(self, name):
    """Checks if the specified cluster exists.
    Args:
      name: the name of the cluster to lookup.
    Returns:
      True if the cluster exists; False otherwise.
    Raises:
      Exception if there was an error requesting information about the cluster.
    """
    try:
      _ = self._api.clusters_get(name)
    except gcp._util.RequestException as e:
      if e.status == 404:
        return False
      raise e
    except Exception as e:
      raise e
    return True

  def create(self, name, region):
    """Creates a new cluster.
    Args:
      name: a unique name for the new cluster.
    Returns:
      The newly created cluster.
    Raises:
      Exception if there was an error creating the cluster.
    """
    return Cluster(name, context=self._context).create(self._project_id, region)

  def list(self):
    try:
      list_info = self._api.clusters_list()
    except Exception as e:
      raise e

    clusters = []
    cluster_infos = list_info.get('clusters', [])
    if len(cluster_infos):
      try:
        clusters = [Cluster(info['clusterName'], info, context=self._context) for info in cluster_infos]
      except KeyError:
        raise Exception('Unexpected response from server')

    return clusters

  def __iter__(self):
    return iter(gcp._util.Iterator(self.list))
