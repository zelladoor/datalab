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


/// <reference path="../../../../../../../../externs/ts/angularjs/angular.d.ts" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import actions = require('app/shared/actions');
import uuid = require('app/common/uuid');
import cells = require('app/shared/cells');
import _app = require('app/App');


var log = logging.getLogger(constants.scopes.actionEmitter);

class ActionEmitter implements app.IActionEmitter {

  _rootScope: ng.IRootScopeService;

  static $inject = ['$rootScope'];
  constructor (rootScope: ng.IRootScopeService) {
    this._rootScope = rootScope;
  }

  addCell (cellType: string, worksheetId: string, insertAfterCellId: string) {
    var addCellAction: app.notebook.action.AddCell = {
      action: actions.worksheet.addCell,
      worksheetId: worksheetId,
      cellId: uuid.v4(),
      type: cellType,
      source: '',
      insertAfter: insertAfterCellId
    };
    this._emitAction(addCellAction)
  }

  clearOutput (cellId: string, worksheetId: string) {
    var clearOutputAction: app.notebook.action.ClearOutput = {
      action: actions.cell.clearOutput,
      worksheetId: worksheetId,
      cellId: cellId
    };
    this._emitAction(clearOutputAction);
  }

  clearOutputs () {
    var clearOutputsAction: app.notebook.action.ClearOutputs = {
      action: actions.notebook.clearOutputs
    };
    this._emitAction(clearOutputsAction);
  }

  deleteCell (cellId: string, worksheetId: string) {
    var deleteCellAction: app.notebook.action.DeleteCell = {
      action: actions.worksheet.deleteCell,
      cellId: cellId,
      worksheetId: worksheetId
    }
    this._emitAction(deleteCellAction);
  }

  /**
   * Emits a composite action with both update+execute
   *
   * In the case of non-code cells, only an update action will be emitted
   */
  evaluateCell (cell: app.notebook.Cell, worksheetId: string) {
    if (cell.type != cells.code) {
      // Then we can simply send an update cell action
      this.updateCell(cell, worksheetId);
      return;
    }

    var compositeAction: app.notebook.action.Composite = {
      action: actions.composite,
      subActions: [
        this._createUpdateCellAction(cell, worksheetId),
        this._createExecuteCellAction(cell.id, worksheetId)
      ]
    }
    this._emitAction(compositeAction);
  }

  executeCell (cellId: string, worksheetId: string) {
    this._emitAction(this._createExecuteCellAction(cellId, worksheetId));
  }

  executeCells () {
    var executeCellsAction: app.notebook.action.ExecuteCells = {
      action: actions.notebook.executeCells
    };
    this._emitAction(executeCellsAction);
  }

  updateCell (cell: app.notebook.Cell, worksheetId: string) {
    this._emitAction(this._createUpdateCellAction(cell, worksheetId));
  }

  _createExecuteCellAction (
      cellId: string,
      worksheetId: string
      ): app.notebook.action.ExecuteCell {

    return {
      action: actions.cell.execute,
      worksheetId: worksheetId,
      cellId: cellId
    }
  }

  _createUpdateCellAction (
      cell: app.notebook.Cell,
      worksheetId: string
      ): app.notebook.action.UpdateCell {

    return {
      action: actions.cell.update,
      worksheetId: worksheetId,
      cellId: cell.id,
      source: cell.source,
      outputs: [],
      replaceOutputs: true,
      metadata: cell.metadata,
      replaceMetadata: true
    }
  }

  _emitAction(action: app.notebook.action.Action) {
    this._rootScope.$emit(action.action, action);
  }
}

_app.registrar.service(constants.actionEmitter.name, ActionEmitter);
log.debug('Registered action emitter service');
