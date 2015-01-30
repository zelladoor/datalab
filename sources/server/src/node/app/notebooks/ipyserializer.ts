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
    console.log('TODO(bryantd): serialize to ipynb format');
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

    ipynb.worksheets[0].cells.forEach(function (ipyCell: any) {
      var cell;
      switch (ipyCell.cell_type) {
        case 'markdown':
          cell = deserializeIPyMarkdownCell(<app.ipy.MarkdownCell>ipyCell);
          break;
        case 'code':
          cell = deserializeIPyCodeCell(<app.ipy.CodeCell>ipyCell);
          break;
        case 'heading':
          cell = deserializeIPyHeadingCell(<app.ipy.HeadingCell>ipyCell);
          break;
        default:
          console.log('WARNING: skipping unsupported cell type: ', ipyCell.cell_type);
      }

      // Attach the converted cell to the notebook
      notebook.cells[cell.id] = cell;
      notebook.worksheet.push(cell.id);
    });

    console.log('@@@@@ FROM IPY CAME: ', JSON.stringify(notebook, null, 4));
    return notebook;
  }

}

function createCell(): app.notebook.Cell {
  return {
    id: uuid.v4(),
    metadata: {}
  };
}

function deserializeIPyCodeCell (ipyCell: app.ipy.CodeCell): app.notebook.Cell {
  var cell = createCell();
  cell.type = 'code';
  cell.source = ipyCell.input.join('');
  cell.executionCounter = ''+ipyCell.prompt_number;
  cell.metadata.language = ipyCell.language;
  cell.outputs = [];

  // Now handle the deserialization of any outputs for the code cell
  ipyCell.outputs.forEach(function (ipyOutput: any) {
    switch (ipyOutput.output_type) {
      case 'display_data': // equivalent to pyout case, fall-through
      case 'pyout':
        cell.outputs.push(deserializeIPyRichOutput (ipyOutput));
        break;
      case 'stream':
        cell.outputs.push(deserializeIPyStreamOutput (ipyOutput));
        break;
      default:
        console.log('WARNING: skipping unsupported cell output type: ', ipyOutput.output_type);
    }
  });
  return cell;
}

function deserializeIPyStreamOutput (ipyOutput: any): app.notebook.CellOutput {
  return {
    type: ipyOutput.stream,
    mimetypeBundle: {
      'text/plain': ipyOutput.text.join('')
    }
  }
}

/**
 * Deserialize an ipython (v3) format mimetype bundle
 */
function deserializeIPyRichOutput (ipyOutput: any): app.notebook.CellOutput {
  var output: app.notebook.CellOutput = {
    type: 'result',
    mimetypeBundle: {}
  };

  Object.keys(ipyOutput).forEach(function (key) {
    switch(key) {
      case 'png':
        // The base64 encoded png data is the value of the property
        output.mimetypeBundle['image/png'] = ipyOutput.png;
        break;
      case 'html':
        output.mimetypeBundle['text/html'] = ipyOutput.html.join('');
        break;
      case 'text':
        output.mimetypeBundle['text/plain'] = ipyOutput.text.join('');
        break;
      // non-mimetype properties that can exist within the object
      case 'metadata':
      case 'output_type':
        break; // not a mimetype
      default:
        console.log('WARNING: skipping unsupported output mimetype: ', key)
    }
  });

  return output;
}

var DEFAULT_HEADING_LEVEL = 1;
function deserializeIPyHeadingCell (ipyCell: app.ipy.HeadingCell): app.notebook.Cell {
  var cell = createCell();
  cell.type = 'heading';
  cell.source = ipyCell.source.join('');
  cell.metadata.level = ipyCell.level || DEFAULT_HEADING_LEVEL;
  return cell;
}

function deserializeIPyMarkdownCell (ipyCell: app.ipy.MarkdownCell): app.notebook.Cell {
  var cell = createCell();
  cell.type = 'markdown';
  cell.source = ipyCell.source.join('');
  return cell;
}

/**
 * Notes on ipynb format interop
 *
 * - nb.metadata.signature
 *   * sha256 signature of the notebook content
 *   * used for validating the cell output media (e.g., javascript) is trusted
 *   * ipython seems to ignore the signature field if it is not included
 */
