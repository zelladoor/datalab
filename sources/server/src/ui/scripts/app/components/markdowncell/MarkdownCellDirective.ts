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
 * Directive for creating a single markdown cell
 *
 * A Markdown cell has two modes: view and edit
 *
 * In "view" mode:
 * - Double-clicking the cell switches the cell to edit mode
 *
 * In "edit" mode:
 * - "Executing" the cell (shift-enter currently) switches the cell to view mode
 */
/// <reference path="../../../../../../../../externs/ts/angularjs/angular.d.ts" />
/// <amd-dependency path="app/components/editorcell/EditorCellDirective" />
/// <amd-dependency path="app/components/markdownviewer/MarkdownViewerDirective" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import _app = require('app/App');


var log = logging.getLogger(constants.scopes.markdownCell);

class MarkdownCellController implements app.ICellController {

  _rootScope: ng.IRootScopeService;
  _scope: app.CellScope;

  showEditRegion: boolean;
  showPreviewRegion: boolean;

  static $inject: string[] = ['$scope', '$rootScope'];
  constructor (scope: app.CellScope, rootScope: ng.IRootScopeService) {
    this._scope = scope;
    this._rootScope = rootScope;
    this.showPreviewRegion = true; // always-on for markdown cell
    this.showEditRegion = true;

    scope.keymap = this._createKeymap();
    scope.ctrl = this;
  }

  switchToEditMode () {
    console.warn('Markdown cell switching to edit mode...');
    var that = this;
    this._rootScope.$evalAsync(() => {
      that.showEditRegion = true;
    });
  }

  _createKeymap () {
    return {
      'Shift-Enter': this._handleSwitchToViewMode.bind(this)
    }
  }

  _handleSwitchToViewMode () {
    console.warn('Markdown cell switching to view-only mode...');
    var that = this;
    this._rootScope.$evalAsync(() => {
      that.showEditRegion = false;
    });
  }

  foo (msg: string) {
    console.warn('markdown cell says: ' + msg);
  }

}

/**
 * Creates a directive definition.
 */
function markdownCellDirective (): ng.IDirective {
  return {
    restrict: 'E',
    scope: {
      cell: '='
    },
    templateUrl: constants.scriptPaths.app + '/components/markdowncell/markdowncell.html',
    replace: true,
    controller: MarkdownCellController
  }
}

_app.registrar.directive(constants.markdownCell.directiveName, markdownCellDirective);
log.debug('Registered markdown cell directive');
