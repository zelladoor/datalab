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
 * Common utility functions and constants for working with notebook data
 */
/// <reference path="../../../../../../externs/ts/node/node-uuid.d.ts" />
import uuid = require('node-uuid');
import cells = require('../shared/cells');


/**
 * Name for notebooks with unspecified name
 */
export var defaultNotebookName = 'Untitled Notebook';

/**
 * Name for worksheets with unspecified name
 */
export var defaultWorksheetName = 'Untitled Worksheet';

// Starter notebook default content configuration
var defaultCodeCellContent = '';
var defaultHeadingCellLevel = 1;
var defaultHeadingCellContent = 'This is a heading';
var defaultMarkdownCellContent = 'You **can** write markdown here';

/**
 * Creates an empty notebook with no cells
 */
export function createEmptyNotebook (): app.notebook.Notebook {
  var cells: app.notebook.Cell[] = [];
  var worksheetId = uuid.v4();
  var notebook: app.notebook.Notebook = {
    id: uuid.v4(),
    metadata: {},
    name: defaultNotebookName,
    worksheetIds: [worksheetId],
    worksheets: {
      worksheetId: {
        id: worksheetId,
        name: defaultWorksheetName,
        metadata: {},
        cells: cells
      }
    }
  };
  return notebook;
}

/**
 * Creates a new notebook with an initial (non-empty) set of cells
 *
 * The purpose of the initial set of cells is to provide the user with some fill-in-the-blank
 * bits to aid in getting started.
 *
 * Since most notebooks follow a similar initial cell pattern (title cell, summary text cell,
 * code), prepopulate a set of cells that matches this common pattern.
 */
export function createStarterNotebook (): app.notebook.Notebook {
  var notebook = createEmptyNotebook();
  appendHeadingCell(notebook);
  appendMarkdownCell(notebook);
  appendCodeCell(notebook);
  return notebook;
}

/**
 * Appends a code cell to the default worksheet within the notebook
 */
function appendCodeCell (notebook: app.notebook.Notebook) {
  var cell = {
    id: uuid.v4(),
    type: cells.code,
    source: defaultCodeCellContent,
    metadata: {}
  }
  getDefaultWorksheet(notebook).cells.push(cell);
}

/**
 * Appends a heading cell to the default worksheet within the notebook
 */
function appendHeadingCell (notebook: app.notebook.Notebook) {
  var cell = {
    id: uuid.v4(),
    type: cells.heading,
    source: defaultHeadingCellContent,
    metadata: {
      level: defaultHeadingCellLevel
    }
  }
  getDefaultWorksheet(notebook).cells.push(cell);
}

/**
 * Appends a markdown cell to the default worksheet within the notebook
 */
function appendMarkdownCell (notebook: app.notebook.Notebook) {
  var cell = {
    id: uuid.v4(),
    type: cells.markdown,
    source: defaultMarkdownCellContent,
    metadata: {}
  }
  getDefaultWorksheet(notebook).cells.push(cell);
}

/**
 * Gets the default worksheet from the notebook for appending cells
 */
function getDefaultWorksheet (notebook: app.notebook.Notebook): app.notebook.Worksheet {
  // Return the first worksheet by default
  var worksheetId = notebook.worksheetIds[0];
  return notebook.worksheets[worksheetId];
}
