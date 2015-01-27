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


import fs = require('fs');

/**
 * Manages storage operations backed by a local file system
 */
export class LocalFileSystemStorage implements app.IStorage {

  _storageRootPath: string;

  constructor (storageRootPath: string) {
    this._storageRootPath = storageRootPath;
  }

  read (path: string) {
    return null;
  }

  write (path: string, data: string) {
    console.log('Writing to path: ' + path, data);
    fs.writeFile(this._getAbsolutePath(path), data, this._handleError.bind(this));
  }

  delete (path: string) {
    return false;
  }

  _getAbsolutePath (path: string) {
    return this._storageRootPath + path;
  }

  _handleError (error: any) {
    if (error) {
      console.log('ERROR during FileIO', error);
    }
  }

}
