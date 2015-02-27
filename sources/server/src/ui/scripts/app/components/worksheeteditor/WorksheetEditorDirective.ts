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
/// <amd-dependency path="app/components/actionemitter/ActionEmitter" />
/// <amd-dependency path="app/components/cellinserter/CellInserterDirective" />
/// <amd-dependency path="app/components/codecell/CodeCellDirective" />
/// <amd-dependency path="app/components/markdowncell/MarkdownCellDirective" />
/// <amd-dependency path="app/components/headingcell/HeadingCellDirective" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import _app = require('app/App');


var log = logging.getLogger(constants.scopes.worksheetEditor);

interface WorksheetEditorScope extends ng.IScope {
  worksheet?: app.notebook.Worksheet;
  ctrl?: WorksheetEditorController;
}

class WorksheetEditorController {
  _actionEmitter: app.IActionEmitter;
  _scope: WorksheetEditorScope;

  static $inject = ['$scope', constants.actionEmitter.name];
  constructor (scope: WorksheetEditorScope, actionEmitter: app.IActionEmitter) {
    this._actionEmitter = actionEmitter;
    this._scope = scope;

    this._scope.ctrl = this;
  }

  /**
   * Emits a move cell (up) action to move the cell at the given index
   */
  moveCellUp (cellIndexToMove: number) {
    var cell = this._scope.worksheet[cellIndexToMove];
    switch (cellIndexToMove) {
      case 0:
        // Cannot move cell up, already at top of worksheet (no-op)
        return;
      case 1:
        // Move the cell to the top of the worksheet.
        // Because there is not currently an insertBefore option for the move cell action
        // a insertAfter value of null is used to indicate inserting at the head of the worksheet
        actionEmitter.moveCel(this._scope.worksheet.id, cell.id, null);
      break;
      default:
        // Given worksheet cell ids [A, B, C, D], if we want to move C "up" (towards beginning of
        // worksheet), we want to insert cell C after cell A, which is two before cell C
        var insertAfterCell = this._scope.worksheet.cells[cellIndexToMove - 2];
        actionEmitter.moveCel(this._scope.worksheet.id, cell.id, insertAfterCell.id);
    }
  }

  /**
   * Emits a move cell (down) action to move the cell at the given index
   */
  moveCellDown (cellIndexToMove: number) {
    var cell = this._scope.worksheet[cellIndexToMove];

    if (cellIndexToMove == (this._scope.worksheet.cells.length - 1)) {
      // Then this the cell to move is already last, so no-op
      return;
    }

    // Insert the current cell after the next cell
    var nextCell = this._scope.worksheet.cells[cellIndexToMove + 1];
    actionEmitter.moveCell(this._scope.worksheet.id, cell.id, nextCell.id);
  }
}

function worksheetEditorDirective (): ng.IDirective {
  return {
    restrict: 'E',
    scope: {
      worksheet: '='
    },
    replace: true,
    controller: WorksheetEditorController,
    templateUrl: constants.scriptPaths.app + '/components/worksheeteditor/worksheeteditor.html',
  }
}

_app.registrar.directive(constants.worksheetEditor.directiveName, worksheetEditorDirective);
log.debug('Registered worksheet editor directive');
