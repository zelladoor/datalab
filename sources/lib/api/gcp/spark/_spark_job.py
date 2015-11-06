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
import _base_spark_job


class SparkJob(_base_spark_job.BaseSparkJob):
  """Represents a base class for one type of Spark jobs.
  See https://cloud.google.com/dataproc/reference/rest/v1beta1/projects.jobs#Job.
  """

  def __init__(self, cluster_name, context=None, args=None, jarFileUris=None,
               fileUris=None, archiveUris=None, properties=None, mainJarFileUri=None,
               mainClass=None):
    """Initializes an instance of a SparkJob.
    Args:
      job_id: the Spark job ID corresponding to this job.
      cluster_name: The name of the cluster where the job is submitted.
      context: a Context object providing project_id and credentials.
    """
    super(SparkJob, self).__init__(cluster_name, context)
    self._args = args
    self._jarFileUris = jarFileUris
    self._fileUris = _fileUris
    self._archiveUris = archiveUris
    self._properties = properties
    self._mainJarFileUri = mainJarFileUri
    self._mainClass = mainClass

  def submit():
    spark_job_data = {
      'sparkJob': {
        # TODO(alekseyv): add the rest
        # "args": [
        #     string
        #     ],
        # "jarFileUris": [
        #     string
        #     ],
        # "fileUris": [
        #     string
        #     ],
        # "archiveUris": [
        #     string
        #     ],
        # "properties": {
        #     string: string,
        #     ...
        #     },
        # "loggingConfiguration": {
        #     object(LoggingConfiguration)
        #     },
        # // Union field, only one of the following:
        # "mainJarFileUri": string,
        # "mainClass": string,
        }
      }

    if self._mainClass is not None:
      spark_job_data['sparkJob']['mainClass'] = mainClass

    return self._api.jobs_submit(spark_job_data) # this should return spark._job.Job
