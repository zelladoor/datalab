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
import cells = require('../shared/cells');
import nbutil = require('./util');
import updates = require('../shared/updates');
import util = require('../common/util');


export class ActiveNotebook implements app.IActiveNotebook {

  _notebook: app.notebook.Notebook;

  constructor (notebook: app.notebook.Notebook) {
    this._notebook = notebook;
  }

  /**
   * Applies the given action to the notebook and returns and notebook model updates generated
   */
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
      case actions.worksheet.deleteCell:
        return this._applyDeleteCell(<app.notebook.action.DeleteCell>action);
      case actions.worksheet.moveCell:
        return this._applyMoveCell(<app.notebook.action.MoveCell>action);
      default:
        throw util.createError('Unsupported action "%s" cannot be applied', action.action);
    }
  }

  /**
   * Creates a data-only object suitable for JSON serialization
   */
  // FIXME: call this getNotebookData() for consistency elsewhere
  getSnapshot (): app.notebook.Notebook {
    return this._notebook;
  }

  getCell (cellId: string, worksheetId: string) {
    return this._getCellOrThrow(cellId, worksheetId);
  }

  _applyAddCell (action: app.notebook.action.AddCell): app.notebook.update.AddCell {
    // Get the worksheet where the cell should be added
    var worksheet = this._getWorksheetOrThrow(action.worksheetId);
    // Create a cell to insert
    var cell = nbutil.createCell(action.type, action.cellId, action.source);

    // If an insertion point was defined, verify the given cell id exists within the worksheet
    var insertIndex: number;
    if (action.insertAfter) {
      // Find the cell to insert after in the worksheet
      insertIndex = this._getCellIndexOrThrow(worksheet, action.insertAfter);
      // Increment the index because we want to insert after the "insertAfter" cell id
      ++insertIndex;
    } else {
      // Prepend the cell to the beginning of the worksheet
      insertIndex = 0;
    }
    // Insert the cell at the insert index;
    worksheet.cells.splice(insertIndex, 0, cell);

    // Create and return the update message
    return {
      update: updates.worksheet.addCell,
      worksheetId: worksheet.id,
      cell: cell,
      insertAfter: action.insertAfter
    }
  }

  _applyClearOutput (action: app.notebook.action.ClearOutput): app.notebook.update.CellUpdate {
    return this._clearCellOutput(action.cellId, action.worksheetId);
  }

  _applyClearOutputs (action: app.notebook.action.ClearOutputs): app.notebook.update.Composite {
    // Create a composite update message in which the per-cell updates will be bundled
    var update: app.notebook.update.Composite = {
      update: updates.composite,
      subUpdates: []
    }

    // Iterate through each worksheet within the notebook
    this._notebook.worksheets.forEach((worksheet) => {
      // Clear each cell within the worksheet
      worksheet.cells.forEach((cell: app.notebook.Cell) => {
        if (cell.type == cells.code) {
          var cellUpdate = this._clearCellOutput(cell.id, worksheet.id);
          // Add an update for the cleared cell
          update.subUpdates.push(cellUpdate);
        }
      }, this);
    }, this);

    return update;
  }

  _applyDeleteCell (action: app.notebook.action.DeleteCell): app.notebook.update.DeleteCell {
    // Get the worksheet from which the cell should be deleted
    var worksheet = this._getWorksheetOrThrow(action.worksheetId);
    // Find the index of the cell to delete within the worksheet
    var cellIndex = this._getCellIndexOrThrow(worksheet, action.cellId);
    // Remove the cell from the worksheet
    var removed = worksheet.cells.splice(cellIndex, 1);
    // Create and return the update message
    return {
      update: updates.worksheet.deleteCell,
      worksheetId: action.worksheetId,
      cellId: action.cellId
    };
  }

  _applyMoveCell (action: app.notebook.action.MoveCell): app.notebook.update.MoveCell {
    // Find the cell to move within the source worksheet
    var sourceWorksheet = this._getWorksheetOrThrow(action.sourceWorksheetId);
    var sourceIndex = this._getCellIndexOrThrow(sourceWorksheet, action.cellId);

    // Remove the cell from the worksheet
    var cellToMove = sourceWorksheet.cells.splice(sourceIndex, 1)[0];

    // Find the insertion point for the cell in the destination worksheet
    var destinationWorksheet = this._getWorksheetOrThrow(action.sourceWorksheetId);
    if (action.insertAfter === null) {
      // Then prepend the cell to the destination worksheet
      destinationWorksheet.cells = [cellToMove].concat(destinationWorksheet.cells);
    } else {
      // Otherwise insert the cell after the specified insertAfter cell id
      var destinationIndex = this._getCellIndexOrThrow(sourceWorksheet, action.insertAfter);
      // The insertion index is one after the "insertAfter" cell's index
      ++destinationIndex;
      // Insert the cell into the destination index
      destinationWorksheet.cells.splice(destinationIndex, 0, cellToMove);
    }


    // Note: the update message is the same as the action message, because the clients
    // need to apply the same cell movement modifications locally.
    return {
      update: updates.worksheet.moveCell,
      sourceWorksheetId: action.sourceWorksheetId,
      destinationWorksheetId: action.destinationWorksheetId,
      cellId: action.cellId,
      insertAfter: action.insertAfter // the cell ID after which to insert the moved cell
    }
  }

  _applyUpdateCell (action: app.notebook.action.UpdateCell): app.notebook.update.CellUpdate {
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

    if (action.metadata) {
      if (action.replaceMetadata) {
        // Simple case, use the action message's metadata to replace the cell's
        cell.metadata = cellUpdate.metadata = action.metadata;
      } else {
        // Merge the metadata objects, with the action overwriting existing fields on the cell
        cellUpdate.metadata = {};
        Object.keys(action.metadata).forEach((property) => {
          cell.metadata[property] = cellUpdate.metadata[property] = action.metadata[property];
        });
      }
      cellUpdate.replaceMetadata = action.replaceMetadata;
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

  _getCellIds (worksheet: app.notebook.Worksheet): string[] {
    return worksheet.cells.map((cell) => {return cell.id});
  }

  _getCellIndexOrThrow (worksheet: app.notebook.Worksheet, cellId: string) {
    var index = this._indexOf(worksheet, cellId);
    if (index === -1) {
      throw util.createError('Cannot find insertAfter cell id "%s"', cellId);
    }
    return index;
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
      throw util.createError('Specified cell id "%s" does not exist within worksheet with id "%s"',
          cellId, worksheetId);
    }
    return cell;
  }

  _getWorksheetOrThrow (worksheetId: string): app.notebook.Worksheet {
    // FIXME: add a worksheetId -> worksheet index for more efficient lookup
    var worksheet: app.notebook.Worksheet;
    this._notebook.worksheets.forEach((ws) => {
      if (worksheetId == ws.id) {
        // Found the worksheet of interest.
        worksheet = ws;
      }
    });

    if (worksheet === undefined) {
      throw util.createError('Specified worksheet id "%s" does not exist', worksheetId);
    }

    return worksheet;
  }

  /**
   * Find the index of the cell with given id within the worksheet
   *
   * Returns the index of the cell matching the given id if it is found.
   * Otherwise, returns -1 to indicate that a cell with specified cell id doesn't exist in the
   * given worksheet, so return sentinel value to indicate the id was not found.
   * Note: same sentinel value as Array.indexOf()
   */
  _indexOf (worksheet: app.notebook.Worksheet, cellId: string): number {
    for (var i = 0; i < worksheet.cells.length; ++i) {
      if (cellId == worksheet.cells[i].id) {
        return i;
      }
    }
    // No cell with the specified id exists within the worksheet
    return -1;
  }

}
