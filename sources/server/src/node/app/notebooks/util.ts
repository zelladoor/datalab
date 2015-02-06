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


/**
 * For notebooks that lack a specified name
 */
export var defaultNotebookName = 'Untitled Notebook';

/**
 * For worksheets that lack a specified name
 */
export var defaultWorksheetName = 'Untitled Worksheet';

/**
 * Create an empty notebook with no cells
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
 * Create a new notebook with an initial (non-empty) set of cells
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

function appendHeadingCell (notebook: any) {
  var id = uuid.v4();
  if (!notebook.cells[id]) { // only insert the cell once
    notebook.cells[id] = {
      id: id,
      type: 'heading',
      source: 'This is a heading',
      metadata: {
        // TODO(bryantd): implement a level selector UI element for configuring this attribute
        level: 1
      }
    }
    notebook.worksheet.push(id);
  }
}

function appendMarkdownCell (notebook: any) {
  var id = uuid.v4();
  if (!notebook.cells[id]) { // only insert the cell once
    notebook.cells[id] = {
      id: id,
      type: 'markdown',
      source: 'You **can** write markdown here'
    }
    notebook.worksheet.push(id);
  }
}

function appendCodeCell (notebook: any) {
  var id = uuid.v4();
  if (!notebook.cells[id]) { // only insert the cell once
    notebook.cells[id] = {
      id: id,
      type: 'code',
      source: '',
    }
    notebook.worksheet.push(id);
  }
}
