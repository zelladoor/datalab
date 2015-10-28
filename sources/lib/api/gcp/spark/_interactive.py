import gcp._util
import gcp.data
import _api
import _sampling
import _utils


class Interactive(object):
  """Represents a Query object that encapsulates a BigQuery SQL query.
  This object can be used to execute SQL queries and retrieve results.
  """


  def __init__(self, request, scripts=None, context=None, values=None, **kwargs):
    if context is None:
      context = gcp.Context.default()
    self._context = context
    self._api = _api.Api(context)
    self._scripts = scripts
    self._results = None
    self._sql = request


  def __str__(self):
    """Creates a string representation of this object.
    Returns:
      The string representation of this object (the unmodified SQL).
    """
    return self._sql

  def __repr__(self):
    """Creates a friendly representation of this object.
    Returns:
      The friendly representation of this object (the unmodified SQL).
    """
    return self._sql

  @property
  def sql(self):
    """ Get the SQL for the query. """
    return self._sql

  @property
  def scripts(self):
    """ Get the code for any Javascript UDFs used in the query. """
    return self._scripts

  def execute_async(self, table_name=None, table_mode='create', use_cache=True,
                    priority='interactive', allow_large_results=False):
    """ Initiate the query and return a QueryJob.
    Args:
      dataset_id: the datasetId for the result table.
      table_name: the result table name as a string or TableName; if None (the default), then a
          temporary table will be used.
      table_mode: one of 'create', 'overwrite' or 'append'. If 'create' (the default), the request
          will fail if the table exists.
      use_cache: whether to use past query results or ignore cache. Has no effect if destination is
          specified (default True).
      priority:one of 'batch' or 'interactive' (default). 'interactive' jobs should be scheduled
          to run quickly but are subject to rate limits; 'batch' jobs could be delayed by as much
          as three hours but are not rate-limited.
      allow_large_results: whether to allow large results; i.e. compressed data over 100MB. This is
          slower and requires a table_name to be specified) (default False).
    Returns:
      A QueryJob.
    Raises:
      Exception if query could not be executed.
    """
    batch = priority == 'low'
    append = table_mode == 'append'
    overwrite = table_mode == 'overwrite'
    if table_name is not None:
      table_name = _utils.parse_table_name(table_name, self._api.project_id)

    try:
      query_result = self._api.jobs_insert_query(self._sql, self._scripts,
                                                 table_name=table_name,
                                                 append=append,
                                                 overwrite=overwrite,
                                                 use_cache=use_cache,
                                                 batch=batch,
                                                 allow_large_results=allow_large_results)
    except Exception as e:
      raise e
    if 'jobReference' not in query_result:
      raise Exception('Unexpected query response.')

    job_id = query_result['jobReference']['jobId']
    if not table_name:
      try:
        destination = query_result['configuration']['query']['destinationTable']
        table_name = (destination['projectId'], destination['datasetId'], destination['tableId'])
      except KeyError:
        # The query was in error
        raise Exception(_utils.format_query_errors(query_result['status']['errors']))
    return _query_job.QueryJob(job_id, table_name, self._sql, context=self._context)

  def execute(self, table_name=None, table_mode='create', use_cache=True, priority='interactive',
              allow_large_results=False):
    """ Initiate the query, blocking until complete and then return the results.
    Args:
      table_name: the result table name as a string or TableName; if None (the default), then a
          temporary table will be used.
      table_mode: one of 'create', 'overwrite' or 'append'. If 'create' (the default), the request
          will fail if the table exists.
      use_cache: whether to use past query results or ignore cache. Has no effect if destination is
          specified (default True).
      priority:one of 'batch' or 'interactive' (default). 'interactive' jobs should be scheduled
          to run quickly but are subject to rate limits; 'batch' jobs could be delayed by as much
          as three hours but are not rate-limited.
      allow_large_results: whether to allow large results; i.e. compressed data over 100MB. This is
          slower and requires a table_name to be specified) (default False).
    Returns:
      The QueryResultsTable for the query.
    Raises:
      Exception if query could not be executed.
    """
    job = self.execute_async(table_name=table_name, table_mode=table_mode, use_cache=use_cache,
                             priority=priority, allow_large_results=allow_large_results)
    self._results = job.wait()
    return self._results
