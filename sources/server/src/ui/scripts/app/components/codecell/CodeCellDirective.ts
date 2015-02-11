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
 * Directive for creating a single code cell
 */
/// <reference path="../../../../../../../../externs/ts/angularjs/angular.d.ts" />
/// <amd-dependency path="app/components/editorcell/EditorCellDirective" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import _app = require('app/App');
import actions = require('app/shared/actions');


var log = logging.getLogger(constants.scopes.codeCell);

class CodeCellController implements app.ICellController {

  _rootScope: ng.IRootScopeService;
  _scope: app.CellScope;

  showEditRegion: boolean;
  showPreviewRegion: boolean;

  static $inject: string[] = ['$scope', '$rootScope'];
  constructor (scope: app.CellScope, rootScope: ng.IRootScopeService) {
    this._scope = scope;
    this._rootScope = rootScope;
    this.showPreviewRegion = false; // always-off for code cell
    this.showEditRegion = true; // always-on for code cell

    scope.keymap = this._createKeymap();
    scope.ctrl = this;
  }

  switchToEditMode () { /* noop: code cell always in edit mode */ }

  _createKeymap () {
    return {
      'Shift-Enter': this._handleExecute.bind(this)
    };
  }

  /**
   * Emits a 'cell.execute' action
   *
   * Event is actually a composite containing an update+execute to ensure that the server has the
   * exact source code string the user sees when the execution is requested.
   */
  _handleExecute () {
    // TODO(bryantd): apply a subset of the updates below as "predictive modifications" (e.g.,
    // clear the cell output immediately)
    // TODO(bryantd): apply a visual treatment to show that the cell is in an "executing" state

    var cell = this._scope.cell;
    var update: app.notebook.action.UpdateCell = {
      action: actions.cell.update,
      worksheetId: this._scope.worksheetId,
      cellId: cell.id,
      source: cell.source,
      outputs: [],
      replaceOutputs: true,
      metadata: cell.metadata,
      replaceMetadata: true
    };

    var execute: app.notebook.action.ExecuteCell = {
      action: actions.cell.execute,
      worksheetId: this._scope.worksheetId,
      cellId: cell.id
    };

    var composite: app.notebook.action.Composite = {
      action: actions.composite,
      subActions: [update, execute]
    }

    // Emit the event as a 'cell.execute' event, since that is the primary action occurring and
    // forcing all listeners to also subscribe to all "composite" events would be inefficient as
    // the number of (non-execute) composite events grows.
    //
    // If needed, event listeners can disambiguate this event from a non-composite,
    // execute-without-update by inspecting the action property of the event/message object
    this._rootScope.$emit(actions.cell.execute, composite);
  }
}

/**
 * Creates a directive definition.
 */
function codeCellDirective (): ng.IDirective {
  return {
    restrict: 'E',
    scope: {
      cell: '=',
      worksheetId: '='
    },
    templateUrl: constants.scriptPaths.app + '/components/codecell/codecell.html',
    replace: true,
    controller: CodeCellController
  }
}

_app.registrar.directive(constants.codeCell.directiveName, codeCellDirective);
log.debug('Registered code cell directive');
