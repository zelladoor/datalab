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


import formats = require('./formats');
import transforms = require('./ipynbv3/transforms');
import util = require('../util');


/**
 * Serializer for reading/writing the .ipynb (IPython) v3 format
 *
 * Eventually this serializer will need to branch based upon the nbformat field specified
 * within the ipynb and then delegate to a ipynb version-specific serializer
 */
export class IPySerializer implements app.INotebookSerializer {

  /**
   * Deserialize an in-memory notebook model from a JSON string
   */
  parse (notebookData: string, format: string) {
    this._validateFormatOrThrow(format);

    // Read the raw file contents (json blob) into an object
    var ipynb = JSON.parse(notebookData);
    console.log(JSON.stringify(ipynb, null, 4));

    var notebook = util.createEmptyNotebook();
    // FIMXE: set the notebook name here somehow... need filename for consistency with ipython

    // Get a reference to the first worksheet
    var worksheet = notebook.worksheets[notebook.worksheetIds[0]];

    // Notebooks created by IPython in v3 format will have zero or one worksheet(s)
    if (ipynb.worksheets.length === 0) {
      // Nothing else to convert from ipynb format
      return notebook;
    }

    // Notebook has a single worksheet
    var ipynbWorksheet = ipynb.worksheets[0];

    ipynbWorksheet.cells.forEach(function (ipyCell: any) {
      var cell: app.notebook.Cell;
      switch (ipyCell.cell_type) {
        case 'markdown':
          cell = transforms.fromIPyMarkdownCell(<app.ipy.MarkdownCell>ipyCell);
          break;
        case 'code':
          cell = transforms.fromIPyCodeCell(<app.ipy.CodeCell>ipyCell);
          break;
        case 'heading':
          cell = transforms.fromIPyHeadingCell(<app.ipy.HeadingCell>ipyCell);
          break;
        default:
          console.log('WARNING: skipping unsupported cell type: ', ipyCell.cell_type);
      }
      // Attach the converted cell to the worksheet
      worksheet.cells.push(cell);
    });

    return notebook;
  }

  /**
   * Serialize the in-memory notebook model as-is to a JSON string
   */
  stringify (notebook: app.notebook.Notebook, format: string) {
    this._validateFormatOrThrow(format);

    // TODO(bryantd): serialize to ipynb format
    throw 'NotImplemented';
    return 'NotImplemented'; // Must return string response for compilation to succeed
  }

  /**
   * Validate that this serializer can parse the notebook specified format.
   *
   * Throws an exception if the format is unsupported by this serializer.
   */
  _validateFormatOrThrow (format: string) {
    if (format != formats.names.ipynbV3) {
      throw new Error('Unsupported notebook format for serialization: "' + format + '"');
    }
  }

}
