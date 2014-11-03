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
 * Directive for rendering a single notebook
 */
/// <reference path="../../../../../../../../externs/ts/angularjs/angular.d.ts" />
/// <amd-dependency path="app/components/editorcell/EditorCellDirective" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import app = require('app/App');


var log = logging.getLogger(constants.scopes.notebookEditor);

interface DirectiveScope extends ng.IScope { // FIXME: naming convention for local scopes
  notebook?: any; // FIXME: define type
  ctrl?: any;
}

class Ctrl {
  _scope: DirectiveScope;
  _rootScope: ng.IRootScopeService;

  _nextCellNum: number; // FIXME: replace this with uuid gen

  static $inject = ['$scope', '$rootScope'];
  constructor (scope: DirectiveScope, rootScope: ng.IRootScopeService) {
    this._scope = scope;
    this._rootScope = rootScope;

    this._nextCellNum = 0;
    // TODO:
    // * bits for adding/removing/moving cells
    // * some keyboard handlers for "notebook-level events" (when in command mode)
    // * logic for switching cell mode (edit/command) based upon events (keys)

    rootScope.$on('execute-cell', this._handleExecuteCellEvent.bind(this));
  }

  _handleExecuteCellEvent (event: any, cell: any) {
    log.debug('[nb] execute-cell event for cell: ', cell);
    // Find the current index of the cell in the worksheet
    var currentIndex = this._scope.notebook.worksheet.indexOf(cell.id);
    if (currentIndex === -1) {
      log.error('Attempted to insert a cell based upon a non-existent cell id');
    }

    var nextIndex = currentIndex + 1;
    log.debug('setting active cell to index ' + nextIndex);
    if (nextIndex < this._scope.notebook.worksheet.length) {
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
    var cellId = this._scope.notebook.worksheet[index];
    return this._scope.notebook.cells[cellId];
  }

  _makeCellActive (cell: any) {
    this._rootScope.$evalAsync(() => {
      cell.active = true;
    });
  }

  _insertBlankCell (index: number) {
    var newCell = this._createBlankCell();
    this._scope.notebook.worksheet.push(newCell.id);
    this._scope.notebook.cells[newCell.id] = newCell;
    return newCell;
  }

  _generateCellId () {
    return this._nextCellNum++;
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

  _createBlankCell () {
    return {
      id: this._generateUUID(),
      type: 'code', // FIXME: default cell type move to constant
      executionCounter: '-', // FIXME CONSTANT (needs to be a nbsp, but that requires html trusting too), fix this
      source: '' // a blank line
    }
  }

  _insertCell (cell: any, index: number) {
    this._scope.notebook.worksheet.splice(index, /* num elements to remove */ 0, cell);
  }

}

// FIXME: RENAME  this file and the template to be notebook-editor
function notebookEditorDirective (): ng.IDirective {
  return {
    restrict: 'E',
    scope: {
      notebook: '='
    },
    replace: true,
    controller: Ctrl,
    templateUrl: constants.scriptPaths.app + '/components/notebook/notebook.html',
  }
}

app.registrar.directive(constants.notebookEditor.directiveName, notebookEditorDirective);
log.debug('Registered notebook directive');
