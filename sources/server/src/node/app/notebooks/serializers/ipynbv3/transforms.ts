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
 * Transformation functions from .ipynb-formatted objects to datalab in-memory notebook types
 */
/// <reference path="../../../../../../../../externs/ts/node/node-uuid.d.ts" />
import nbutil = require('../../util');
import util = require('../../../common/util');
import uuid = require('node-uuid');


export function fromIPyCodeCell (ipyCell: app.ipy.CodeCell): app.notebook.Cell {
  var cell = _createCell();
  cell.type = 'code';
  cell.source = ipyCell.input.join('');
  cell.prompt = ''+ipyCell.prompt_number;
  cell.metadata = ipyCell.metadata || {};
  cell.metadata.language = ipyCell.language;
  cell.outputs = [];

  // Now handle the deserialization of any outputs for the code cell
  ipyCell.outputs.forEach((ipyOutput) => {
    switch (ipyOutput.output_type) {
      case 'display_data': // equivalent to pyout case, fall-through
      case 'pyout':
        cell.outputs.push(fromIPyRichOutput(ipyOutput));
      break;

      case 'stream':
        cell.outputs.push(fromIPyStreamOutput(ipyOutput));
      break;

      case 'pyerr':
        cell.outputs.push(fromIPyErrorOutput(ipyOutput));
      break;

      default:
        console.log('WARNING: skipping unsupported cell output type: ', ipyOutput.output_type);
    }
  });
  return cell;
}

function fromIPyErrorOutput (ipyOutput: any): app.notebook.CellOutput {
  return util.createErrorOutputMimetypeBundle(
      ipyOutput.ename, ipyOutput.evalue, ipyOutput.traceback);
}

function fromIPyStreamOutput (ipyOutput: any): app.notebook.CellOutput {
  return {
    type: ipyOutput.stream,
    mimetypeBundle: {
      'text/plain': ipyOutput.text.join('')
    }
  }
}

/**
 * from an ipython (v3) format mimetype bundle
 */
function fromIPyRichOutput (ipyOutput: any): app.notebook.CellOutput {
  var output: app.notebook.CellOutput = {
    type: 'result',
    mimetypeBundle: {}
  };

  Object.keys(ipyOutput).forEach((key) => {
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
export function fromIPyHeadingCell (ipyCell: app.ipy.HeadingCell): app.notebook.Cell {
  var cell = _createCell();
  cell.type = 'heading';
  cell.source = ipyCell.source.join('');
  cell.metadata = ipyCell.metadata || {};
  cell.metadata.level = ipyCell.level || DEFAULT_HEADING_LEVEL;
  return cell;
}

export function fromIPyMarkdownCell (ipyCell: app.ipy.MarkdownCell): app.notebook.Cell {
  var cell = _createCell();
  cell.type = 'markdown';
  cell.source = ipyCell.source.join('');
  cell.metadata = ipyCell.metadata || {};
  return cell;
}

export function fromIPyNotebook (ipyNotebook: app.ipy.Notebook): app.notebook.Notebook {
  var notebook = nbutil.createEmptyNotebook();
  // Copy over the notebook-level metadata if it was defined
  notebook.metadata = ipyNotebook.metadata || {};

  // Notebooks created by IPython in v3 format will have zero or one worksheet(s)
  // because no existing IPython tools are capable of creating/reading multiple worksheets.
  //
  // As part of DataLab's multi-worksheet support, DataLab may export multi-worksheet .ipynb
  // but this is unlikely since no other tools will be able to read beyond the first worksheet.
  //
  // Thus, assume zero or one worksheet, but throw an informative error if these expectations are
  // not met.
  if (ipyNotebook.worksheets.length === 0) {
    // Nothing else to convert from ipynb format
    return notebook;
  } else if (ipyNotebook.worksheets.length > 1) {
    //
    throw new Error('Multi-worksheet .ipynb notebooks are not currently supported');
  }

  // Then the .ipynb notebook has a single worksheet
  var ipynbWorksheet = ipyNotebook.worksheets[0];

  // Get a reference to the first worksheet in the converted notebook
  var worksheet = notebook.worksheets[notebook.worksheetIds[0]];
  worksheet.metadata = ipynbWorksheet.metadata || {};

  ipynbWorksheet.cells.forEach(function (ipyCell: any) {
    var cell: app.notebook.Cell;
    switch (ipyCell.cell_type) {
      case 'markdown':
        cell = fromIPyMarkdownCell(<app.ipy.MarkdownCell>ipyCell);
        break;
      case 'code':
        cell = fromIPyCodeCell(<app.ipy.CodeCell>ipyCell);
        break;
      case 'heading':
        cell = fromIPyHeadingCell(<app.ipy.HeadingCell>ipyCell);
        break;
      default:
        console.log('WARNING: skipping unsupported cell type: ', ipyCell.cell_type);
    }
    // Attach the converted cell to the worksheet
    worksheet.cells.push(cell);
  });

  return notebook;
}


function _createCell(): app.notebook.Cell {
  return {
    id: uuid.v4(),
    metadata: {}
  };
}
