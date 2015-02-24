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


import actions = require('../shared/actions');
import formats = require('./serializers/formats');
import updates = require('../shared/updates');
import util = require('./util');


/**
 * FIXME come up with a better name for this class
 */
export class ActiveNotebook implements app.IActiveNotebook {

  _notebook: app.notebook.Notebook;
  _notebookPath: string;
  _serializedFormat: string;
  _serializer: app.INotebookSerializer;
  _storage: app.IStorage;

  constructor (notebookPath: string, storage: app.IStorage, serializer: app.INotebookSerializer) {
    this._storage = storage;
    this._serializer = serializer;

    this._setNotebookPath(notebookPath);
    this._notebook = this._readOrCreateNotebook();
  }

  /**
   * Creates a data-only object suitable for JSON serialization
   */
  getSnapshot (): app.notebook.Notebook {
    return this._notebook;
  }

  getCell (cellId: string, worksheetId: string) {
    return <app.notebook.Cell>{id: 'todo'};
  }

  apply (action: app.notebook.action.Action): app.notebook.update.Update {
    switch (action.action) {
      case actions.cell.clearOutput:
        return this._applyClearOutput(<app.notebook.action.ClearOutput>action);
      case actions.cell.update:
        return this._applyUpdateCell(<app.notebook.action.UpdateCell>action);
      case actions.notebook.clearOutputs:
        return this._applyClearOutputs(<app.notebook.action.ClearOutputs>action);
      case actions.worksheet.addCell:
        return this._applyAddCell(<app.notebook.action.AddCell>action);
      default:
        throw new Error('Unsupported action "'+action.action+'" cannot be applied');
    }
  }

  _applyAddCell (action: app.notebook.action.AddCell): app.notebook.update.AddCell {
    // Get the worksheet where the cell should be added
    var worksheet = this._getWorksheetOrThrow(action.worksheetId);
    // Create a cell to insert
    var cell = util.createCell(action.type, action.cellId, action.source);

    // If an insertion point was defined, verify the given cell id exists within the worksheet
    if (action.insertAfter) {
      throw new Error('TODO(bryantd): add support for insertAfter property');
    } else {
      // Append the cell to the tail of the worksheet
      worksheet.cells.push(cell);
    }

    // Create and return the update message
    return {
      update: updates.worksheet.addCell,
      worksheetId: worksheet.id,
      cell: cell
    }
  }

  _applyClearOutput(action: app.notebook.action.ClearOutput): app.notebook.update.CellUpdate {
    return this._clearCellOutput(action.cellId, action.worksheetId);
  }

  _applyClearOutputs (action: app.notebook.action.ClearOutputs): app.notebook.update.Composite {
    // Create a composite update message in which the per-cell updates will be bundled
    var update: app.notebook.update.Composite = {
      update: updates.composite,
      subUpdates: []
    }

    var nb = this._notebook;
    // Iterate through each worksheet within the notebook
    nb.worksheetIds.forEach((worksheetId: string) => {
      // Clear each cell within the worksheet
      nb.worksheets[worksheetId].cells.forEach((cell: app.notebook.Cell) => {
        var cellUpdate = this._clearCellOutput(cell.id, worksheetId);
        // Add an update for the cleared cell
        update.subUpdates.push(cellUpdate);
      }, this);
    }, this);

    return update;
  }

  _applyUpdateCell(action: app.notebook.action.UpdateCell): app.notebook.update.CellUpdate {
    // Get the cell where the update should be applied
    var cell = this._getCellOrThrow(action.cellId, action.worksheetId);

    // Create the base cell update and add to it as modifications are made to the notebook model
    var cellUpdate: app.notebook.update.CellUpdate = {
      update: updates.cell.update,
      worksheetId: action.worksheetId,
      cellId: action.cellId,
    };

    // Enumerate the attributes that should be updated on the cell and apply the modifications
    if (action.source) {
      // Then update the cell source attribute and the update message
      cell.source = cellUpdate.source = action.source;
    }

    if (action.metadata) {
      if (action.replaceMetadata) {
        // Simple case, use the action message's metadata to replace the cell's
        cell.metadata = cellUpdate.metadata = action.metadata;
      } else {
        // Merge the metadata objects, with the action overwriting existing fields on the cell
        cellUpdate.metadata = {};
        Object.keys(action.metadata).forEach((property: string) => {
          cell.metadata[property] = cellUpdate.metadata[property] = action.metadata[property];
        });
      }
      cellUpdate.replaceMetadata = action.replaceMetadata;
    }

    if (action.outputs) {
      if (action.replaceOutputs) {
        // Simple case, replace the cell's outputs with the output list in the action message
        cell.outputs = cellUpdate.outputs = action.outputs;
      } else {
        // Append the outputs in the action message to the cell's outputs
        cell.outputs = cell.outputs.concat(action.outputs);
        // The update message will only carry the outputs to be appended
        cellUpdate.outputs = action.outputs;
      }
      cellUpdate.replaceOutputs = action.replaceOutputs;
    }

    return cellUpdate;
  }

  _clearCellOutput (cellId: string, worksheetId: string): app.notebook.update.CellUpdate {
    // Get the cell where the outputs should be cleared
    var cell = this._getCellOrThrow(cellId, worksheetId);
    // Clear the outputs
    cell.outputs = [];
    // Create and return the update message
    return {
      update: updates.cell.update,
      worksheetId: worksheetId,
      cellId: cellId,
      outputs: cell.outputs,
      replaceOutputs: true
    };
  }

  _getCellOrThrow (cellId: string, worksheetId: string): app.notebook.Cell {
    // Get the worksheet where the cell is expected to exist
    var worksheet = this._getWorksheetOrThrow(worksheetId);

    // Find the cell in the worksheet
    //
    // Note: may be worthwhile to maintain a {cellId: cell} index if this gets expensive, or
    // mirror the worksheet structure with a cells + cellIds field to capture both an index and the
    // ordering of cells within the worksheet
    //
    // As opposed to the current direct list-based cell storage approach
    // (cells: [<cell1>, <cell2>, ...]).
    var cell: app.notebook.Cell;
    for (var i = 0; i < worksheet.cells.length; ++i) {
      if (worksheet.cells[i].id == cellId) {
        cell = worksheet.cells[i];
        break; // Found the cell of interest
      }
    }
    // Verify that the cell was actually found within the worksheet
    if (cell === undefined) {
      throw new Error('Specified cell id "' + cellId
        + '" does not exist within worksheet with id "' + worksheetId + '"');
    }
    return cell;
  }

  _getWorksheetOrThrow (worksheetId: string): app.notebook.Worksheet {
    var worksheet = this._notebook.worksheets[worksheetId];
    if (worksheet === undefined) {
      throw new Error('Specified worksheet id "'+worksheetId+'" does not exist');
    }
    return worksheet;
  }

  /**
   * Reads in the notebook if it exists or creates a blank notebook if not.
   */
  _readOrCreateNotebook (): app.notebook.Notebook {
    var notebook: app.notebook.Notebook;
    // First, attempt to read in the notebook if it already exists at the defined path
    var notebookData = this._storage.read(this._notebookPath);
    if (notebookData === undefined) {
      notebook = util.createStarterNotebook();
    } else {
      // Deserialize the notebook data
      notebook = this._serializer.parse(notebookData, 'todo');
    }
    return notebook;
  }

  _setNotebookPath (notebookPath: string) {
    this._notebookPath = notebookPath;
    this._serializedFormat = formats.selectNotebookFormat(notebookPath);
  }
}


// FIXME: get rid of anything below that isn't re-intergrated with ws protocol update

  // putCell (cell: app.notebook.Cell): app.notebook.Notebook {
  //   this._notebook.cells[cell.id] = cell;
  //   this._updateWorksheet(cell);
  //   this._persistNotebook();
  //   return this.getData();
  // }

  // updateCell (cell: app.notebook.Cell): app.notebook.Notebook {
  //   var mergedCell: app.notebook.Cell = this._notebook.cells[cell.id];
  //   if (!mergedCell) {
  //     // Nothing to merge with, simple case
  //     return this.putCell(cell);
  //   }

  //   // Copy over any keys from the given partial/whole cell update
  //   Object.keys(cell).forEach((property) => {
  //     if (property == 'outputs') {
  //       // Output values need to be appended rather than overwritten
  //       this._appendCellOutputs(mergedCell, cell);
  //     } else {
  //       // Updated properties overwrite (even nested) existing properties
  //       mergedCell[property] = cell[property];
  //     }
  //   });

  //   return this.putCell(mergedCell);
  // }


  // // Given a "changes"/delta cell, append the outputs of the delta to the given "merged" cell
  // _appendCellOutputs (mergedCell: app.notebook.Cell, deltaCell: app.notebook.Cell) {
  //   // Update should be called with only the new data (i.e., not pre-merged/pre-combined)
  //   // so append any new outputs to the tail of the current set of outputs
  //   if (mergedCell.outputs) {
  //     // Append new outputs to the end of the list
  //     mergedCell.outputs = mergedCell.outputs.concat(deltaCell.outputs);
  //   } else {
  //     // Nothing to merge with, write the full set of outputs
  //     mergedCell.outputs = deltaCell.outputs;
  //   }
  // }

  // _persistNotebook () {
  //   // TODO(bryantd): re-enable this once ipynb serialization is implemented
  //   // console.log('Saving notebook ' + this._notebookPath + ' ...');
  //   // this._storage.write(this._notebookPath, this._serializer.toString(this.getData()));
  // }

  // _updateWorksheet (cell: app.notebook.Cell) {
  //   // append the cell to the end of the worksheet if it isn't alread on the worksheet
  //   if (-1 === this._notebook.worksheet.indexOf(cell.id)) {
  //     // Then the cell isn't on the worksheet currently, append it
  //     this._notebook.worksheet.push(cell.id);
  //   }
  // }
