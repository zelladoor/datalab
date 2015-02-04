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
 * Directive for creating a single editor cell
 *
 * The input region provides and editable text region. The output region appears if there is any
 * output content, and disappears is the output content is falsey (undefined/null/empty).
 */
/// <reference path="../../../../../../../../externs/ts/angularjs/angular.d.ts" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import app = require('app/App');


var log = logging.getLogger(constants.scopes.editorCell); // FIXME: scope name

export class NotebookData {

  notebook: any; // FIXME: define an interface for this

  _eventScope: ng.IRootScopeService; // FIXME: just use the rootscope ref, don't define another ref
  _rootScope: ng.IRootScopeService;
  _sce: ng.ISCEService;

  // Mimetype preference order used by IPython
  static _preferredMimetypes = [
    'application/javascript',
    'text/html',
    'text/markdown',
    'text/latex',
    'image/svg+xml',
    'image/png',
    'image/jpeg',
    'application/pdf',
    'text/plain'];

  static $inject = ['$rootScope', '$sce'];
  constructor (rootScope: ng.IRootScopeService, sce: ng.ISCEService) {
    this._eventScope = rootScope; // FIXME: refactor to just refer to _rootScope throughout
    this._rootScope = rootScope;
    this._sce = sce;

    // FIXME: clean this up, possible to simplify the nesting?
    var callback: Function = this._updateNotebook.bind(this);
    rootScope.$on('notebook-update', (event: any, nb: any) => {
      rootScope.$evalAsync(() => { callback(event, nb) });
    });

    rootScope.$on('execute-cell', this._handleExecuteCellEvent.bind(this));
  }

  // FIXME: eventually this will accept (one or more) deltas
  // but it will be the full notebook for now
  _updateNotebook (event: any, newNotebook: any) {
    log.debug('New notebook snapshot received (via websocket)', newNotebook);

    if (!newNotebook) {
      log.debug('Unable to update notebook with a false-y notebook data model. Ignoring...');
      return; // FIXME: better handling of this case
    }

    this._selectNotebookOutputMimetypes(newNotebook)

    if (this.notebook) {
      this._mergeNotebook(newNotebook);
    } else {
      this.notebook = newNotebook;
    }
  }

  // FIXME: move this to a library/util module
  // Light-weight uuid generation for cell ids
  // Source: http://stackoverflow.com/a/8809472
  _generateUUID (): string {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
  }

  insertMarkdownCell () {
    var id = this._generateUUID();
    if (!this.notebook.cells[id]) { // only insert the cell once
      this.notebook.cells[id] = {
        id: id,
        type: 'markdown',
        source: '',
        active: true
      }
      this.notebook.worksheet.push(id);
    }
  }

  insertCodeCell () {
    var id = this._generateUUID();
    if (!this.notebook.cells[id]) { // only insert the cell once
      this.notebook.cells[id] = {
        id: id,
        type: 'code',
        source: '',
        active: true
      }
      this.notebook.worksheet.push(id);
    }
  }

  insertHeadingCell () {
    var id = this._generateUUID();
    if (!this.notebook.cells[id]) { // only insert the cell once
      this.notebook.cells[id] = {
        id: id,
        type: 'heading',
        source: '',
        active: true,
        metadata: {
          // TODO(bryantd): implement a level selector UI element for configuring this attribute
          level: 1
        }
      }
      this.notebook.worksheet.push(id);
    }
  }

  // FIXME: this method will change substantially or be replaced in full once notebook values
  // are being broadcasted rather than the full notebook
  _mergeNotebook (newNotebook: any) {

    var that = this;

    Object.keys(newNotebook.cells).forEach((cellId: any) => {
      var currentCell = that.notebook.cells[cellId];
      var newCell = newNotebook.cells[cellId];
      if (currentCell) { // FIXME: doesn't look like cellIndex is used below... remove this?
        var cellIndex = that.notebook.worksheet.indexOf(currentCell.id);
      }

      // TODO(bryantd): Logic for merging worksheet order needs to be implemented here eventually
      // Side-stepping issue at the moment because the worksheet is append-only currently
      var isActive = false;
      if (!currentCell) { // New cell received push it to tail of worksheet
        that.notebook.worksheet.push(cellId);
      } else {
        // If this cell is currently active, keep it active
        isActive = that.notebook.cells[cellId].active;
      }

      // Overwrite individual cells as they are broadcast from server
      // TODO(bryantd): currently only overwrite code cells, since only those are being persisted
      // to the server. Overwriting markdown cells will cause the contents to be erased since markdown
      // cells are not "saved" to the server (yet)
      if (newNotebook.cells[cellId].type == 'code') {
        that.notebook.cells[cellId] = newNotebook.cells[cellId];
      }


      // FIXME: consider here all of the client-side modifications to a cell
      // that might be blown away on update. Currently just concerned with cell.active flag
      //
      // Seems like there is a set of user-specific settings/state (e.g., cursor, active part of the page)
      // that shouldn't be broadcasted/shared with all users
      //
      // Or maybe we should broadcast/persist these things, they just need to be
      // marked as owned by user X (like realtime api)
      //
      // Leaning towards publishing the entirety of the state to the server
      // because managing some local dirty state that needs re-application feels fragile
      // and will eventually go away once we have multi-user working.
      //
      // Publishing the full state to the server for generating the ui-side view has the downside
      // of adding more details to the content update message protocol between ui/server, but has
      // the advantage of moving *all* notebook state server-side, simplifying the ui-side code

      // Re-mark the cell as active if it was active before the update
      if (isActive) {
        that.notebook.cells[cellId].active = isActive
      }

    });

  }

  /**
   * Selects a mimetype for the cell output out of possibilities within mimetype bundle
   */
  _selectMimetype (output: any) { // FIXME TYPE app.notebook.AugmentedCellOutput
    var bundle = output.mimetypeBundle;
    if (!bundle) {
      log.warn('Received an output with no mimetype bundle: ', output);
      return;
    }
    output.preferredMimetype = this._findPreferredMimetype(bundle);

    // Bail if there isn't a preferred mimetype within the bundle
    if (!output.preferredMimetype) {
      log.warn('Unable to select a mimetype for cell output: ', output);
      return;
    }

    // Create a trusted html wrapper for the html content so that it is display-able
    if (output.preferredMimetype == 'text/html') {
      output.trustedHtml = this._sce.trustAsHtml(bundle['text/html']);
    }
  }

  /**
   * Select mimetypes for all cell outputs within the given notebook
   */
  _selectNotebookOutputMimetypes (notebook: any) {
    // Iterate through the cells
    Object.keys(notebook.cells).forEach((cellId) => {
      var cell = notebook.cells[cellId];
      if (cell.outputs) {
        // Iterate through each cell's output and select a mimetype (one per output)
        cell.outputs.forEach(this._selectMimetype.bind(this));
      }
    });
  }

  /**
   * Finds the preferred mimetype from the options available in a given mimetype bundle.
   *
   * The preferred mimetype for displaying a given output is modeled on IPython's preference list.
   *
   * Returns null if none of the preferred mimetypes are available within the bundle.
   */
  _findPreferredMimetype (mimetypeBundle: any) {
    for (var i = 0; i < NotebookData._preferredMimetypes.length; ++i) {
      var mimetype = NotebookData._preferredMimetypes[i];
      if (mimetypeBundle.hasOwnProperty(mimetype)) {
        return mimetype;
      }
    }
    return null;
  }


///////////////////////// FIXME: organize the below with the above

  _handleExecuteCellEvent (event: any, cell: any) {
    log.debug('[nb] execute-cell event for cell: ', cell);
    // Find the current index of the cell in the worksheet
    var currentIndex = this.notebook.worksheet.indexOf(cell.id);
    if (currentIndex === -1) {
      log.error('Attempted to insert a cell based upon a non-existent cell id');
    }

    var nextIndex = currentIndex + 1;
    log.debug('setting active cell to index ' + nextIndex);
    if (nextIndex < this.notebook.worksheet.length) {
      // There's already a cell at the next index, make it active
      log.debug('found an existing cell to make active');
      this._makeCellActive(this._getCellByIndex(nextIndex));
    } else {
      // Otherwise, append blank cell
      log.debug('creating a blank cell to append');
      var newCell = this._insertBlankCell(nextIndex);
      this._makeCellActive(newCell);
    }
  }

  _getCellByIndex (index: number) {
    var cellId = this.notebook.worksheet[index];
    return this.notebook.cells[cellId];
  }

  _makeCellActive (cell: any) {
    this._rootScope.$evalAsync(() => {
      cell.active = true;
    });
  }

  _insertBlankCell (index: number) {
    var newCell = this._createBlankCell();
    this.notebook.worksheet.push(newCell.id);
    this.notebook.cells[newCell.id] = newCell;
    return newCell;
  }

  _createBlankCell () {
    return {
      id: this._generateUUID(),
      type: 'code', // FIXME: default cell type move to constant
      executionCounter: '-', // FIXME CONSTANT (needs to be a nbsp, but that requires html trusting too), fix this
      source: '' // a blank line
    }
  }

  _insertCell (cell: any, index: number) {
    this.notebook.worksheet.splice(index, /* num elements to remove */ 0, cell);
  }

}

app.registrar.service('notebookData', NotebookData); // FIXME: move constant to constants
log.debug('Registered notebook data service');
