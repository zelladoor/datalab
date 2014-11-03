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


// FIXME: move this discussion to the design doc for the server
// Mention the advantage/value in separating the realtime
// part (this object) from the persistence part (the storage/repo/serialization bits)
//
// Committing/persisting the data to storage is a different type
// of interaction than updating the notebook data model itself.

/**
 * FIXME add class docs here
 *
 * Note: this class will change substantially once notebook deltas are implemented
 */
export class ActiveNotebook implements app.notebook.IActiveNotebook {

  _notebook: app.notebook.Notebook;

  constructor (notebook: app.notebook.Notebook) {
    this._notebook = notebook;
  }

  // Create a data-only object suitable for JSON serialization
  getData (): app.notebook.Notebook {
    return this._notebook;
  }


  // TODO: eventually return an object of "changes" for broadcasting rather than the full notebook.
  putCell (cell: app.notebook.Cell): app.notebook.Notebook {
    this._notebook.cells[cell.id] = cell;
    this._updateWorksheet(cell);
    return this.getData();
  }

  updateCell (cell: app.notebook.Cell): app.notebook.Notebook {

    var mergedCell = this._notebook.cells[cell.id];
    if (!mergedCell) {
      // Nothing to merge with, simple case
      return this.putCell(cell);
    }

    // Copy over any keys from the given partial/whole cell update
    Object.keys(cell).forEach((property) => {
      if (property == 'outputs') {
        // Output values need to be appended rather than overwritten
        this._appendCellOutputs(mergedCell, cell);
      } else {
        // Updated properties overwrite (even nested) existing properties
        mergedCell[property] = cell[property];
      }
    });

    return this.putCell(mergedCell);
  }

  /**
   * Given a "changes"/delta cell, append the outputs of the delta to the given "merged" cell
   */
  _appendCellOutputs (mergedCell: app.notebook.Cell, deltaCell: app.notebook.Cell) {
    // Update should be called with only the new data (i.e., not pre-merged/pre-combined)
    // so append any new outputs to the tail of the current set of outputs
    if (mergedCell.outputs) {
      // Append new outputs to the end of the list
      mergedCell.outputs = mergedCell.outputs.concat(deltaCell.outputs);
    } else {
      // Nothing to merge with, write the full set of outputs
      mergedCell.outputs = deltaCell.outputs;
    }
  }

  _updateWorksheet (cell: app.notebook.Cell) {
    // append the cell to the end of the worksheet if it isn't alread on the worksheet
    if (-1 === this._notebook.worksheet.indexOf(cell.id)) {
      // Then the cell isn't on the worksheet currently, append it
      this._notebook.worksheet.push(cell.id);
    }
  }

}


