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


import formats = require('../notebooks/serializers/formats');
import nb = require('../notebooks/notebooksession');
import nbutil = require('../notebooks/util');


export class NotebookPersister implements app.INotebookPersister {

  _notebookPath: string;
  _notebookSerializer: app.INotebookSerializer;
  _storage: app.IStorage;

  constructor (notebookPath: string, storage: app.IStorage) {
    this._storage = storage;

    this.setNotebookPath(notebookPath);
  }

  /**
   * Gets the current notebook path.
   */
  getNotebookPath () {
    return this._notebookPath;
  }

  /**
   * Reads in the notebook if it exists or creates a starter notebook if not.
   */
  readOrCreate (): app.INotebookSession {
    console.log('Reading notebook ' + this._notebookPath + ' ...');
    // First, attempt to read in the notebook if it already exists at the defined path.
    var serializedNotebook = this._storage.read(this._notebookPath);
    var notebookData: app.notebooks.Notebook;
    if (serializedNotebook === undefined) {
      // Notebook didn't exist, so create a starter notebook.
      notebookData = nbutil.createStarterNotebook();
    } else {
      // Notebook already existed. Deserialize the notebook data.
      notebookData = this._notebookSerializer.parse(serializedNotebook);
    }
    // Create the notebook wrapper to manage the notebook model state.
    return new nb.NotebookSession(notebookData);
  }

  /**
   * Updates the notebook path and selects a serializer for the given extension.
   */
  setNotebookPath (notebookPath: string) {
    this._notebookPath = notebookPath;
    // Selects the serializer that has been assigned to the notebook path extension.
    this._notebookSerializer = formats.selectSerializer(this._notebookPath);
  }

  /**
   * Serializes the given notebook and writes it to storage.
   */
  write (notebook: app.INotebookSession) {
    console.log('Saving notebook ' + this._notebookPath + ' ...');
    // Serialize the current notebook model state to the format inferred from the file extension
    var serializedNotebook = this._notebookSerializer.stringify(notebook.getNotebookData());
    this._storage.write(this._notebookPath, serializedNotebook);
  }

}
