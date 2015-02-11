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
 * Directive controller for document-based cells (markdown and heading)
 */
/// <reference path="../../../../../../../../externs/ts/angularjs/angular.d.ts" />
import actions = require('app/shared/actions');


export class DocumentCellController implements app.ICellController {

  _rootScope: ng.IRootScopeService;
  _scope: app.CellScope;

  showEditRegion: boolean;
  showPreviewRegion: boolean;

  static $inject: string[] = ['$scope', '$rootScope'];
  constructor (scope: app.CellScope, rootScope: ng.IRootScopeService) {
    this._scope = scope;
    this._rootScope = rootScope;
    this.showPreviewRegion = true; // always-on for heading cell
    this.showEditRegion = false; // hide the edit region until the cell is put in edit mode

    scope.keymap = this._createKeymap();
    scope.ctrl = this;
  }

  switchToEditMode () {
    var that = this;
    this._rootScope.$evalAsync(() => {
      that.showEditRegion = true;
    });
  }

  switchToViewMode () {
    var that = this;
    this._rootScope.$evalAsync(() => {
      that.showEditRegion = false;
    });
  }

  _createKeymap () {
    return {
      'Shift-Enter': this._handleFinishedEditing.bind(this)
    }
  }

  /**
   * Emits a 'cell.update' action
   */
  _handleFinishedEditing () {
    var cell = this._scope.cell;
    var update: app.notebook.action.UpdateCell = {
      action: actions.cell.update,
      worksheetId: this._scope.worksheetId,
      cellId: cell.id,
      source: cell.source,
      metadata: cell.metadata,
      replaceMetadata: true
    }

    this._rootScope.$emit(actions.cell.update, update);
    this.switchToViewMode();
  }
}
