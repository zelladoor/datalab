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
import app = require('app/App');


var log = logging.getLogger(constants.scopes.markdownCell);

interface MarkdownCellScope extends ng.IScope {
  cell: any;
  keymap?: any;
  editMode?: boolean; // edit mode versus view/render mode
  ctrl?: MarkdownCellController;
}

class MarkdownCellController {

  _rootScope: ng.IRootScopeService;
  _scope: MarkdownCellScope;

  static $inject: string[] = ['$scope', '$rootScope'];
  constructor (scope: MarkdownCellScope, rootScope: ng.IRootScopeService) {
    this._scope = scope;
    this._rootScope = rootScope;

    scope.keymap = this._createKeymap();
    scope.editMode = true;
    scope.ctrl = this;
  }

  switchToEditMode () {
    console.warn('Markdown cell switching to edit mode...');
    var scope = this._scope;
    this._rootScope.$evalAsync(() => {
      scope.editMode = true;
    });
  }

  _createKeymap () {
    return {
      'Shift-Enter': this._handleSwitchToViewMode.bind(this)
    }
  }

  _handleSwitchToViewMode () {
    console.warn('Markdown cell switching to view-only mode...');
    var scope = this._scope;
    this._rootScope.$evalAsync(() => {
      scope.editMode = false;
    });
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

app.registrar.directive(constants.markdownCell.directiveName, markdownCellDirective);
log.debug('Registered markdown cell directive');
