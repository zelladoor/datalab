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


describe('Notebook model state', () => {
  var notebook: app.IActiveNotebook;
  var worksheetId: string;

  beforeEach(() => {
    notebook = new nb.ActiveNotebook('foo.ipynb', testutil.mockStorage, testutil.mockSerializer);
    worksheetId = testutil.getFirstWorksheet(notebook).id;
  });

  afterEach(() => {
    notebook = undefined;
    worksheetId = undefined;
  });

  it('should be an empty notebook with one worksheet and zero cells', () => {
    var notebookData: app.notebook.Notebook = notebook.getSnapshot()
    expect(notebookData.worksheetIds.length).toBe(1);
    var worksheetId = notebookData.worksheetIds[0];
    expect(notebookData.worksheets[worksheetId]).toBeDefined();
    var worksheet = notebookData.worksheets[worksheetId];
    expect(worksheet.cells.length).toBe(0);
  });

  // action = notebook.clearOutputs
  describe('after notebook.clearOutputs action', () => {
    var notebookData: app.notebook.Notebook;

    beforeEach(() => {
      var output: app.notebook.CellOutput = {
        type: 'stdout',
        mimetypeBundle: {'text/plain': 'some stdout here'}
      };

      notebookData = notebook.getSnapshot();

      // Add a second worksheet
      var worksheetId2 = 'another-worksheet';
      notebookData.worksheets[worksheetId2] = {
        id: 'worksheet-2',
        name: 'Worksheet2',
        metadata: {},
        cells: []
      };
      notebookData.worksheetIds.push(worksheetId2);

      // Add some cells with outputs to each worksheet
      Object.keys(notebookData.worksheets).forEach((worksheetId: string) => {
        notebookData.worksheets[worksheetId].cells.push({
          id: worksheetId + '-cell-1',
          type: 'code',
          outputs: [output, output]
        });
        notebookData.worksheets[worksheetId].cells.push({
          id: worksheetId + '-cell-2',
          type: 'code',
          outputs: [output, output]
        });
      });
    });

    afterEach(() => {
      notebookData = undefined;
    });

    it('should remove all of the outputs from every cell, in every worksheet', () => {
      // Validate there are two worksheets, each with two cells, each with two outputs
      expect(Object.keys(notebookData.worksheets).length).toBe(2);
      notebookData.worksheetIds.forEach((worksheetId: string) => {
        var cells = notebookData.worksheets[worksheetId].cells;
        expect(cells.length).toBe(2);
        cells.forEach((cell: app.notebook.Cell) => {
          expect(cell.outputs.length).toBe(2);
        });
      });

      var action = {action: 'notebook.clearOutputs'};
      var update = <app.notebook.update.Composite>notebook.apply(action);

      // Now each worksheet should still have two cells, each with zero outputs
      notebookData.worksheetIds.forEach((worksheetId: string) => {
        var cells = notebookData.worksheets[worksheetId].cells;
        expect(cells.length).toBe(2);
        cells.forEach((cell: app.notebook.Cell) => {
          expect(cell.outputs.length).toBe(0);
        });
      });
    });
  });

  // action = cell.update
  describe('after cell.update action', () => {
    var cellUpdateAction: app.notebook.action.UpdateCell;
    var cellUpdate: app.notebook.update.CellUpdate;
    var cellIdToUpdate = 'cell-id-to-update';
    var cell: app.notebook.Cell;

    beforeEach(() => {
      cellUpdateAction = {
        action: actions.cell.update,
        worksheetId: worksheetId,
        cellId: cellIdToUpdate,
      };
      // Create a cell to be updated
      cell = {
        id: cellIdToUpdate,
        type: 'code',
        metadata: {meta: 'data'},
        source: 'initial source',
        outputs: [{
          type: 'stdout',
          mimetypeBundle: {'text/plain': 'first output'}
        }]
      }
      // Attach it to the worksheet
      var worksheet = testutil.getFirstWorksheet(notebook);
      worksheet.cells.push(cell);
    });

    afterEach(() => {
      cellUpdateAction = undefined;
      cellUpdate = undefined;
      cell = undefined;
    });

    it('should have the new source string value', () => {
      cellUpdateAction.source = 'updated source';
      var cellUpdate = <app.notebook.update.CellUpdate>notebook.apply(cellUpdateAction);
      expect(cellUpdate.source).toBe('updated source');
      expect(cell.source).toBe('updated source');
    });

    it('should have an additional output', () => {
      cellUpdateAction.outputs = [{
        type: 'stderr',
        mimetypeBundle: {'text/plain': 'second output'}
      }];
      var cellUpdate = <app.notebook.update.CellUpdate>notebook.apply(cellUpdateAction);
      // Validate that the update message is as expected
      expect(cellUpdate.outputs.length).toBe(1);
      expect(cellUpdate.outputs[0].mimetypeBundle['text/plain']).toBe('second output');
      expect(cellUpdate.replaceOutputs).toBeFalsy();
      // Validate that the notebook cell was updated accordingly
      expect(cell.outputs.length).toBe(2);
      expect(cell.outputs[0].mimetypeBundle['text/plain']).toBe('first output');
      expect(cell.outputs[1].mimetypeBundle['text/plain']).toBe('second output');
    });

    it('should have only the new output value', () => {
      cellUpdateAction.outputs = [{
        type: 'stderr',
        mimetypeBundle: {'text/plain': 'second output'}
      }];
      cellUpdateAction.replaceOutputs = true;
      var cellUpdate = <app.notebook.update.CellUpdate>notebook.apply(cellUpdateAction);
      // Validate that the update message is as expected
      expect(cellUpdate.outputs.length).toBe(1);
      expect(cellUpdate.outputs[0].mimetypeBundle['text/plain']).toBe('second output');
      expect(cellUpdate.replaceOutputs).toBe(true);
      // Validate that the notebook cell was updated accordingly
      expect(cell.outputs.length).toBe(1);
      expect(cell.outputs[0].mimetypeBundle['text/plain']).toBe('second output');
    });

    it('should also have the new metadata field', () => {
      cellUpdateAction.metadata = {more: 'meta'};
      var cellUpdate = <app.notebook.update.CellUpdate>notebook.apply(cellUpdateAction);
      // Validate that the update message is as expected
      // The update message will only carry the updated metadata fields
      expect(Object.keys(cellUpdate.metadata).length).toBe(1);
      expect(cellUpdate.metadata['meta']).not.toBeDefined();
      expect(cellUpdate.metadata['more']).toBe('meta');
      expect(cellUpdate.replaceMetadata).toBeFalsy();
      // Validate that the notebook cell was updated accordingly
      expect(Object.keys(cell.metadata).length).toBe(2);
      expect(cell.metadata['meta']).toBe('data');
      expect(cell.metadata['more']).toBe('meta');
    });

    it('should have only the new metadata field', () => {
      cellUpdateAction.metadata = {more: 'meta'};
      cellUpdateAction.replaceMetadata = true;
      var cellUpdate = <app.notebook.update.CellUpdate>notebook.apply(cellUpdateAction);
      // Validate that the update message is as expected
      expect(Object.keys(cellUpdate.metadata).length).toBe(1);
      expect(cellUpdate.metadata['meta']).not.toBeDefined();
      expect(cellUpdate.metadata['more']).toBe('meta');
      expect(cellUpdate.replaceMetadata).toBe(true);
      // Validate that the notebook cell was updated accordingly
      expect(Object.keys(cell.metadata).length).toBe(1);
      expect(cell.metadata['meta']).not.toBeDefined();
      expect(cell.metadata['more']).toBe('meta');
    });

    it('should have no metadata fields', () => {
      cellUpdateAction.metadata = {/* empty metadata dict */};
      cellUpdateAction.replaceMetadata = true;
      var cellUpdate = <app.notebook.update.CellUpdate>notebook.apply(cellUpdateAction);
      // Validate that the update message is as expected
      expect(Object.keys(cellUpdate.metadata).length).toBe(0);
      expect(cellUpdate.replaceMetadata).toBe(true);
      // Validate that the notebook cell was updated accordingly
      expect(Object.keys(cell.metadata).length).toBe(0);
    });
  });

  // action = cell.clearOutput
  describe('after cell.clearOutput action', () => {
    var clearOutputAction: app.notebook.action.ClearOutput;
    var cellUpdate: app.notebook.update.CellUpdate;
    var cellIdToClear = 'cell-id-to-clear';

    beforeEach(() => {
      clearOutputAction = {
        action: actions.cell.clearOutput,
        worksheetId: worksheetId,
        cellId: cellIdToClear,
      };

      // Create a cell with a non-zero number of outputs to be cleared
      var worksheet = testutil.getFirstWorksheet(notebook);
      worksheet.cells.push({
        id: cellIdToClear,
        outputs: [{
          type: 'stdout',
          mimetypeBundle: {'text/plain': 'some stdout here'}
        }]
      });
    });

    afterEach(() => {
      clearOutputAction = undefined;
      cellUpdate = undefined;
    });

    it('should remove specified cell output', () => {
      // Validate that there is a single cell with non-zero number of outputs before clearing
      var worksheet = testutil.getFirstWorksheet(notebook);
      expect(worksheet.cells.length).toBe(1);
      var cell = worksheet.cells[0];
      expect(cell.id).toBe(cellIdToClear);
      expect(cell.outputs.length).toBeGreaterThan(0);

      // Apply the clear output action
      var cellUpdate = <app.notebook.update.CellUpdate>notebook.apply(clearOutputAction);

      // Validate the outputs of the cell were cleared within the notebook model
      expect(cell.outputs.length).toBe(0);

      // Validate that the update message will clear outputs on all clients
      expect(cellUpdate.cellId).toBe(cellIdToClear);
      expect(cellUpdate.outputs.length).toBe(0);
      expect(cellUpdate.replaceOutputs).toBe(true);
    });
  });

  describe('after worksheet.addCell action', () => {
    var addCellAction: app.notebook.action.AddCell;
    var addCellUpdate: app.notebook.update.AddCell;

    beforeEach(() => {
      addCellAction = {
        action: actions.worksheet.addCell,
        worksheetId: worksheetId,
        cellId: 'new-cell-id',
        type: 'code',
        source: 'some code here'
      };
    });

    afterEach(() => {
      addCellAction = undefined;
      addCellUpdate = undefined;
    });

    it('should add a cell', () => {
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

    // FIXME: enable following tests after finishing the add cell implementation
    // it('should throw an error due to bad insertAfter cell id', () => {
    //   addCellAction.insertAfter = 'does-not-exist';
    //   expect(() => {
    //     notebook.apply(addCellAction);
    //   }).toThrow();
    // });

    // it('should insert a cell after the cell with id foo', () => {
    //   addCellAction.insertAfter = 'cell-to-insert-after';
    //   notebook.apply(addCellAction);
    // });

  });

});
