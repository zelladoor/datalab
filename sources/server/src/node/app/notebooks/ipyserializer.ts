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


/// <reference path="../../../../../../externs/ts/node/node-uuid.d.ts" />
import uuid = require('node-uuid');


/**
 * Serializer for reading/writing the .ipynb (IPython) v3 format
 */
export class IPyNotebookSerializer implements app.INotebookSerializer {

  /**
   * Serialize the in-memory notebook model as-is to a JSON string
   */
  toString (notebook: app.notebook.Notebook) {
    return JSON.stringify(notebook, null, 2);
  }

  /**
   * Deserialize an in-memory notebook model from a JSON string
   */
  fromString (notebookData: string) {
    // Read the raw file contents (json blob) into an object
    var ipynb = JSON.parse(notebookData);
    console.log(JSON.stringify(ipynb, null, 4));

    // Create an empty notebook object for mapping ipynb attributes into
    var notebook: app.notebook.Notebook = {
      id: uuid.v4(),
      cells: {},
      worksheet: []
    };

    // TODO(bryant): handle metadata dicts, etc. not currently mapped
    ipynb.worksheets[0].cells.forEach(function (ipyCell: any) {
      var cell: app.notebook.Cell = {id: uuid.v4()};
      switch (ipyCell.cell_type) {
        case 'markdown':
          cell.type = 'markdown';
          cell.source = ipyCell.source.join('');
          break;
        case 'code':
          cell.type = 'code';
          cell.source = ipyCell.input.join('');
          break;
        case 'heading':
          cell.type = 'markdown';
          cell.source = '## ' + ipyCell.source.join('');
          break;
        default:
          console.log('Skipping unsupported cell type: ', ipyCell.cell_type);
      }

      // Attache the converted cell to the notebook
      notebook.cells[cell.id] = cell;
      notebook.worksheet.push(cell.id);
    });

    console.log('@@@@@ FROM IPY CAME: ', JSON.stringify(notebook, null, 4));
    return notebook;
  }

}
