/// <reference path="../../../../externs/ts/jasmine.d.ts"/>
import nb = require('./app/notebooks/notebook');

describe("A placeholder unit test", () => {

  it("should be a notebook", () => {
    var notebook: any = new nb.ActiveNotebook('/path', {
      read: (path: string) => { return '{"fake": "nb"}'; },
      write: (path: string, data: string) => {},
      delete: (path: string) => {return true;}
    });
    expect(notebook).toNotBe(undefined);
    console.log('notebook: ', notebook);
  });

});
