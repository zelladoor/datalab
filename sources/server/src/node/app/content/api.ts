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
 * Content management HTTP API
 *
 * Handles CRUD operations for file-based resources (e.g., notebooks) stored in GCS.
 *
 * FIXME: other names: FileApi, StorageApi
 */
export class ContentApi {

  _storage: app.IStorageClient;

  constructor (storage: app.IStorageClient) {
    this._storage = storage;
  }

  /**
   * Creates a new file/object in the storage
   */
  create (request: express.Request, response: express.Response) {

  }

}
