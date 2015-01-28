/*
 * Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */


/// <reference path="../../../../../../externs/ts/node/node.d.ts" />
/// <reference path="../../../../../../externs/ts/express/express.d.ts" />
import express = require('express');


/**
 * Storage management HTTP API
 *
 * Handles CRUD operations for file/object-based resources (e.g., notebooks)
 *
 * For implementing the storage browser, currently only need to support a list operation
 * that returns all available files for a given path/prefix along with whatever per-file
 * metadata is needed for display within the storage browser.
 */
export class StorageApi {

  _storage: app.IStorage;

  constructor (storage: app.IStorage) {
    this._storage = storage;
  }

  list (request: express.Request, response: express.Response) {
    // sketch of how this might work
    // var path = request.param('path', null);
    // var files = this._storage.list(path);
    // // FIXME: possible to specify an "ls depth" on the list operation?
    // response.send(files);
  }

}
