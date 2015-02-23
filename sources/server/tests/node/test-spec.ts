/// <reference path="../../../../externs/ts/jasmine.d.ts"/>
import nb = require('./app/notebooks/index');
import nbutil = require('./app/notebooks/util');

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


describe("Notebook model updates", () => {

  it("should be an empty notebook with one worksheet and zero cells", () => {
    var notebook: any = new nb.ActiveNotebook('foo.ipynb', mockStorage, mockSerializer);
    var notebookData: app.notebook.Notebook = notebook.getSnapshot()

    // Validate empty notebook expectations
    expect(notebookData.worksheetIds.length).toBe(1);
    var worksheetId = notebookData.worksheetIds[0];
    expect(notebookData.worksheets[worksheetId]).toBeDefined();
    var worksheet = notebookData.worksheets[worksheetId];
    expect(worksheet.cells.length).toBe(0);
  });
});
