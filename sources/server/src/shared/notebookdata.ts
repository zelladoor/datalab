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


// FIXME: refactor these to have args in this order: cell, worksheet, notebook for consistency
/**
 * Commpm notebook data accessors.
 *
 * TODO(bryantd): could combine these accessors into a class that wraps a app.notebook.Notebook
 * instance, so that indices for direct cell and worksheet access by ID can be built, maintained
 * and used instead of the searching approach implemented currently.
 */


/**
 * Creates an error from the given format string and format args.
 *
 * Note: only supports string args ('%s') currently; all args are coerced to strings before
 * interpolation.
 *
 * This exists to provide a solution that is both NodeJS and browser-compatible (no util.format
 * in the browser currently).
 */
function createError (format: string, ...formatArgs: string[]) {
  // FIXME: finish implementing this. need to add the variable substitution bit
  throw new Error(format + JSON.stringify(formatArgs));
}

/**
 * Gets the index of the specified cell within the given worksheet.
 *
 * Throws an error if the specified cell does not exist within the given worksheet.
 */
export function getCellIndexOrThrow (worksheet: app.notebook.Worksheet, cellId: string) {
  var index = indexOf(worksheet, cellId);
  if (index === -1) {
    throw createError('Cannot find insertAfter cell id "%s"', cellId);
  }
  return index;
}

/**
 * Gets a reference to the specified cell.
 *
 * Throws an error if the cell does not exist within the specified worksheet.
 */
export function getCellOrThrow (
    cellId: string,
    worksheetId: string,
    notebook: app.notebook.Notebook
    ): app.notebook.Cell {

  // Get the worksheet where the cell is expected to exist.
  var worksheet = getWorksheetOrThrow(worksheetId, notebook);
  // Find the cell in the worksheet.
  // Note: may be worthwhile to maintain a {cellId: cell} index if this becomes expensive.
  var cell: app.notebook.Cell;
  for (var i = 0; i < worksheet.cells.length; ++i) {
    if (worksheet.cells[i].id == cellId) {
      cell = worksheet.cells[i];
      break; // Found the cell of interest.
    }
  }
  // Verify that the cell was actually found within the worksheet.
  if (cell === undefined) {
    throw createError('Specified cell id "%s" does not exist within worksheet with id "%s"',
        cellId, worksheetId);
  }
  return cell;
}

/**
 * Gets a reference to the specified worksheet.
 *
 * Throws an error if the specified worksheet does not exist within the notebook.
 */
export function getWorksheetOrThrow (
    worksheetId: string,
    notebook: app.notebook.Notebook
    ): app.notebook.Worksheet {

  var worksheet: app.notebook.Worksheet;
  notebook.worksheets.forEach((ws) => {
    if (worksheetId == ws.id) {
      // Found the worksheet of interest.
      worksheet = ws;
    }
  });

  if (worksheet === undefined) {
    throw createError('Specified worksheet id "%s" does not exist', worksheetId);
  }

  return worksheet;
}

/**
 * Finds the index of the cell with given id within the specified worksheet.
 *
 * Returns the index of the cell matching the given id if it is found.
 *
 * Otherwise, returns -1 to indicate that a cell with specified cell id doesn't exist in the
 * given worksheet, so return sentinel value to indicate the id was not found.
 *
 * Note: same sentinel value as Array.indexOf() for consistency with language built-ins.
 */
export function indexOf (worksheet: app.notebook.Worksheet, cellId: string): number {
  for (var i = 0; i < worksheet.cells.length; ++i) {
    if (cellId == worksheet.cells[i].id) {
      return i;
    }
  }
  // No cell with the specified id exists within the worksheet.
  return -1;
}
