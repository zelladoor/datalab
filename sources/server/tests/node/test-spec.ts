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


/// <reference path="../../../../externs/ts/jasmine.d.ts"/>
import actions = require('./app/shared/actions');
import nb = require('./app/notebooks/index');
import updates = require('./app/shared/updates');
import testutil = require('./testutil');


describe("Notebook model state", () => {

  var notebook: app.IActiveNotebook;
  var worksheetId: string;
  var addCellAction: app.notebook.action.AddCell;
  var addCellUpdate: app.notebook.update.AddCell;

  beforeEach(() => {
    notebook = new nb.ActiveNotebook('foo.ipynb', testutil.mockStorage, testutil.mockSerializer);
    worksheetId = testutil.getFirstWorksheet(notebook).id;
    addCellAction = {
      action: actions.worksheet.addCell,
      worksheetId: worksheetId,
      cellId: 'new-cell-id',
      type: 'code',
      source: 'some code here'
    };
  });

  afterEach(() => {
    notebook = undefined;
    worksheetId = undefined;
    addCellAction = undefined;
    addCellUpdate = undefined;
  });

  it("should be an empty notebook with one worksheet and zero cells", () => {
    var notebookData: app.notebook.Notebook = notebook.getSnapshot()
    expect(notebookData.worksheetIds.length).toBe(1);
    var worksheetId = notebookData.worksheetIds[0];
    expect(notebookData.worksheets[worksheetId]).toBeDefined();
    var worksheet = notebookData.worksheets[worksheetId];
    expect(worksheet.cells.length).toBe(0);
  });

  it("should add a cell after applying the worksheet.addCell action", () => {
    var addCellUpdate = <app.notebook.update.AddCell>notebook.apply(addCellAction);

    // Validate the update message content
    expect(addCellUpdate.update).toBe(updates.worksheet.addCell);
    expect(addCellUpdate.worksheetId).toBe(worksheetId);
    expect(addCellUpdate.cell).toBeDefined();

    // Validate the new cell in the update has the expected structure
    expect(addCellUpdate.cell.id).toBe('new-cell-id');
    expect(addCellUpdate.cell.type).toBe('code');
    expect(addCellUpdate.cell.source).toBe('some code here');

    // Validate that the notebook model was also updated to have the new cell
    var worksheet = testutil.getFirstWorksheet(notebook);
    expect(worksheet.cells.length).toBe(1);
    var cell = worksheet.cells[0];
    expect(cell.id).toBe('new-cell-id');
    expect(cell.type).toBe('code');
    expect(cell.source).toBe('some code here');
  });

  it("should throw an error due to bad insertAfter cell id", () => {
    addCellAction.insertAfter = 'does-not-exist';
    expect(() => {
      notebook.apply(addCellAction);
    }).toThrow();
  });

  it("should insert a cell after the cell with id foo", () => {
    addCellAction.insertAfter = 'does-not-exist';
    notebook.apply(addCellAction);
  });
});
