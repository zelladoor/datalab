/// <reference path="../../../../externs/ts/jasmine.d.ts"/>
import nb = require('./app/notebooks/notebook');

var notebook = {
  name: 'foo',
  id: 'foo-id',
  worksheetIds: ['ws1'],
  worksheets: {
    'ws1': {}
  },
  metadata: {}
};

var mockStorage = {
  read: (path: string) => { return '{"fake": "nb"}'; },
  write: (path: string, data: string) => {},
  delete: (path: string) => {return true;}
};

var mockSerializer = {
  stringify: (notebook: app.notebook.Notebook) => { return 'a-fake-nb-string'; },
  parse: (data: string, format: string) => {
    console.log('mock serializer parse');
    return notebook; }
};


describe("A placeholder unit test", () => {

  it("should be a notebook", () => {
    var notebook: any = new nb.ActiveNotebook('/path/to/nb.ipynb', mockStorage, mockSerializer);
    expect(notebook).toNotBe(undefined);
    console.log('notebook: ', notebook);
  });

});
