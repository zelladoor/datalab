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


import serializer = require('./ipyserializer');
import util = require('./util');


/**
 * FIXME come up with a better name for this class
 */
export class ActiveNotebook implements app.IActiveNotebook {

  _notebook: app.notebook.Notebook;
  _notebookPath: string;
  _storage: app.IStorage;
  _serializer: app.INotebookSerializer;

  constructor (notebookPath: string, storage: app.IStorage) {
    this._notebookPath = notebookPath;
    this._storage = storage;

    // TODO(bryantd): make the set of serializers configurable
    // by specifying a map of extension -> serializer somewhere in configuration and
    // passing it to this constructor instead of creating a serializer per-notebook
    this._serializer = new serializer.IPyNotebookSerializer();

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

  // FIXME: define unit tests for (action + nb-state => update) instances and then writes this code
  apply (action: app.notebook.action.Action) {
    return <app.notebook.update.Update>{update: 'todo'};
  }

  // Reads in the notebook if it exists or creates a blank notebook if not.
  _readOrCreateNotebook (): app.notebook.Notebook {
    var notebook: app.notebook.Notebook;
    // First, attempt to read in the notebook if it already exists at the defined path
    var notebookData = this._storage.read(this._notebookPath);
    if (notebookData === undefined) {
      notebook = util.createStarterNotebook();
    } else {
      // Deserialize the notebook data
      notebook = this._serializer.fromString(notebookData);
    }
    return notebook;
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
