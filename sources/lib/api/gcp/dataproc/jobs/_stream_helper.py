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

"""Helpers for accessing GCS in a byte stream manner."""

import sys
import gcp.storage._item
import gcp.dataproc._api

class StorageObjectSeriesStream(object):
  """I/O Stream-like class for communicating via a sequence of GCS objects."""

  def __init__(self, job_id, context=None):
    """Construct a StorageObjectSeriesStream for a specific gcs path.

    Args:

    Returns:
      The constructed stream.
    """
    # Index of current object in series.
    self._current_object_index = 0

    # Current position in bytes in the current file.
    self._current_object_pos = 0

    if context is None:
      context = gcp.Context.default()

    self._api = gcp.dataproc._api.Api(context) # TODO(alekseyv): move to higher level api
    self._job_id = job_id
    self._job = self._api.jobs_get(job_id)

    if self._job is not None:
      self._open = True
      self._base_path = self._job['driverOutputResourceUri']

  def reset(self):
    self.__init__(self._job_id)

  @property
  def open(self):
    """Whether the stream is open."""
    return self._open

  def close(self):
    """Close the stream."""
    self._open = False

  def _assert_open(self):
    if not self.open:
      raise ValueError('I/O operation on closed stream.')

  def _get_object(self, i):
    """Get the ith object in the series."""
    path = '{0}.{1:09d}'.format(self._base_path, i)
    return gcp.storage._item.Item.from_url(path)

  def read(self, n=sys.maxsize):
    self._assert_open()
    bytes_read = 0
    object_info = None
    max_bytes_to_read = n
    data = []
    if bytes_read < max_bytes_to_read:
      # Cache away next object first.
      next_object_info = self._get_object(self._current_object_index + 1)

      # If next object exists always fetch current object to get final size.
      if not object_info or next_object_info:
        object_info = self._get_object(self._current_object_index)
        if not object_info:
          # Nothing to read yet.
          return []

      new_bytes_available = object_info.metadata().size - self._current_object_pos

      if new_bytes_available < 0:
        raise ValueError('Object [{0}] shrunk.'.format(object_info.name))

      if object_info.metadata().size == 0:
        # There are no more objects to read
        self.close()
        return []

      bytes_left_to_read = max_bytes_to_read - bytes_read
      new_bytes_to_read = min(bytes_left_to_read, new_bytes_available)

      if new_bytes_to_read > 0:
        # Download range.
        data = object_info.read_from() # TODO(alekseyv): implement reading partial content
        data = data[self._current_object_pos:self._current_object_pos + new_bytes_to_read - 1]
        self._current_object_pos += new_bytes_to_read
        bytes_read += new_bytes_to_read

      # Correct since we checked for next object before getting current
      # object's size.
      object_finished = (
          next_object_info and self._current_object_pos == object_info.metadata().size)

      if object_finished:
        object_info = next_object_info
        self._current_object_index += 1
        self._current_object_pos = 0
    else:
        self._job = self._api.jobs_get(job_id)
        if job is not None and job['status']['state'] in ["CANCELLED", "DONE", "ERROR"]: 
          self.close()

    return data
