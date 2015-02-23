/// <reference path="../../../../externs/ts/jasmine.d.ts"/>
import nb = require('./app/notebooks/index');
import nbutil = require('./app/notebooks/util');
import actions = require('./app/shared/actions');
import updates = require('./app/shared/updates');

// FIXME: move mocks and test data generators to some "test utils" module
// Create a template empty notebook and then create deep copies of the template as needed
var emptyNotebook = nbutil.createEmptyNotebook();
var emptyNotebookData = JSON.stringify(emptyNotebook);
function createEmptyNotebook () {
  // One simple approach to deep copy.
  //
  // Not the most performant, but simple, and works for data-only objects as is the case here
  return JSON.parse(emptyNotebookData);
}

var mockStorage = {
  read: (path: string) => {return 'fake-nb-string-1';},
  write: (path: string, data: string) => {},
  delete: (path: string) => {return true;}
};

// Mock serializer always returns a copy of the empty notebook
var mockSerializer = {
  stringify: (notebook: app.notebook.Notebook) => { return 'fake-nb-string-2'; },
  parse: (data: string, format: string) => {return createEmptyNotebook();}
};

function getFirstWorksheet(notebook: app.IActiveNotebook): app.notebook.Worksheet {
  var notebookData = notebook.getSnapshot();
  var worksheetId = notebookData.worksheetIds[0];
  return notebookData.worksheets[worksheetId];
}


describe("Notebook model state", () => {

  it("should be an empty notebook with one worksheet and zero cells", () => {
    var notebook: app.IActiveNotebook = new nb.ActiveNotebook(
        'foo.ipynb', mockStorage, mockSerializer);
    var notebookData: app.notebook.Notebook = notebook.getSnapshot()

    // Validate empty notebook expectations
    expect(notebookData.worksheetIds.length).toBe(1);
    var worksheetId = notebookData.worksheetIds[0];
    expect(notebookData.worksheets[worksheetId]).toBeDefined();
    var worksheet = notebookData.worksheets[worksheetId];
    expect(worksheet.cells.length).toBe(0);
  });

  it("should add a cell after applying the worksheet.addCell action", () => {
    var notebook: app.IActiveNotebook = new nb.ActiveNotebook(
        'foo.ipynb', mockStorage, mockSerializer);

    var worksheetId = getFirstWorksheet(notebook).id;
    var addCellAction: app.notebook.action.AddCell = {
      action: actions.worksheet.addCell,
      worksheetId: worksheetId,
      cellId: 'new-cell-id',
      type: 'code',
      source: 'some code here'
    };

    var addCellUpdate = <app.notebook.update.AddCell>notebook.apply(addCellAction);
    console.log('notebook: ', notebook.getSnapshot());
    console.log('update', addCellUpdate);

    // Validate the update message content
    expect(addCellUpdate.update).toBe(updates.worksheet.addCell);
    expect(addCellUpdate.worksheetId).toBe(worksheetId);
    expect(addCellUpdate.cell).toBeDefined();

    // Validate the new cell in the update has the expected structure
    expect(addCellUpdate.cell.id).toBe('new-cell-id');
    expect(addCellUpdate.cell.type).toBe('code');
    expect(addCellUpdate.cell.source).toBe('some code here');

    // Validate that the notebook model was also updated to have the new cell
    var worksheet = getFirstWorksheet(notebook);
    expect(worksheet.cells.length).toBe(1);
    var cell = worksheet.cells[0];
    expect(cell.id).toBe('new-cell-id');
    expect(cell.type).toBe('code');
    expect(cell.source).toBe('some code here');
  });

});
