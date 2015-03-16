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


/**
 * Test helpers and mocks
 */
import nbutil = require('./app/notebooks/util');

// Create a template empty notebook and then create deep copies of the template as needed
var emptyNotebook = nbutil.createEmptyNotebook();
var emptyNotebookData = JSON.stringify(emptyNotebook);
export function createEmptyNotebook () {
  // One simple approach to deep copy the notebook data
  return JSON.parse(emptyNotebookData);
}

export function getFirstWorksheet(notebook: app.INotebookSession): app.notebooks.Worksheet {
  var notebookData = notebook.getNotebookData();
  return notebookData.worksheets[0];
}

export var mockStorage = {
  read: (path: string) => {return 'fake-nb-string-1';},
  write: (path: string, data: string) => {},
  delete: (path: string) => {return true;}
};

// Mock serializer always returns a copy of the empty notebook
export var mockSerializer = {
  stringify: (notebook: app.notebooks.Notebook) => { return 'fake-nb-string-2'; },
  parse: (data: string, format: string) => {return createEmptyNotebook();}
};
