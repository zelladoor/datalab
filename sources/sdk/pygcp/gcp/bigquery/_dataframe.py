# Copyright 2015 Google Inc. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Implements a DataFrame API on BigQuery."""

from ._constraint import Constraint as _Constraint
from ._query import Query as _Query

# The SQL query:
#
# SELECT word, corpus, word_count
# FROM [publicdata:samples.shakespeare]
# WHERE LENGTH(word) > 4 AND NOT REGEXP_MATCH(word, "^[A-Z]+")
# ORDER BY word_count DESC
# LIMIT 5
#
# Should be:
#
#
#   shake = Table('publicdata:samples.shakespeare')
#   shake.select(shake.word, shake.corpus, shake.word_count)
#        .filter(len(shake.word) > 4, not match(shake.word, "...")
#        .orderBy(shake.word_count, ascending=False)
#        .limit(5)
#
# or:
#
#   shake.select(shake.word, shake.corpus, shake.word_count)
#        [len(shake.word) > 4 and not match(shake.word, "...")]
#        .orderBy(shake.word_count, ascending=False)
#        .limit(5)
#
# That means we could have this just be a special form of query, returned by
# Table.select(Column, ...)
#
# We also need:
#
# DataFrame.join(Table or DataFrame, constraint, type)
# Table.join(Table or DataFrame, constraint, type)


class DataFrame(_Query):

  def __init__(self, api, sql=''):
    super(DataFrame, self).__init__(api, sql)

  def filter(self, *clauses):
    newsql = self._sql
    joiner = "WHERE "
    for clause in clauses:
      newsql += " %s %s" % (joiner, str(clause))
      joiner = "AND "
    return DataFrame(self._api, newsql)

  def __getitem__(self, what):
    if isinstance(what, _Constraint):
      return self.filter(what)
    raise Exception("Cannot filter on a non-constraint")

  def order_by(self, column, ascending=True):
    if not ascending:
      return DataFrame(self._api, self._sql + (' ORDER BY %s DESC' % column))
    else:
      return DataFrame(self._api, self._sql + (' ORDER BY %s' % column))

  def limit(self, n):
    return DataFrame(self._api, self._sql + (' LIMIT %d' % n))

