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
/// <amd-dependency path="app/components/celloutputviewer/CellOutputViewerDirective" />
/// <amd-dependency path="app/components/celltoolbar/CellToolbarDirective" />
/// <amd-dependency path="app/components/codeeditor/CodeEditorDirective" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import _app = require('app/App');


var log = logging.getLogger(constants.scopes.editorCell);

interface EditorCellScope extends ng.IScope {
  cell: app.notebooks.Cell;
  worksheetId: string;
  getKeymap?: any;
  enableEditRegion?: boolean;
  enablePreviewRegion?: boolean;
  onPreviewRegionDoubleClick?: Function;
  notebookData?: app.INotebookData;

  actions?: any;
  active?: boolean;
  keymap?: any;
}

class EditorCellController {

  _notebookData: app.INotebookData;
  _scope: EditorCellScope;

  static $inject = ['$scope', constants.notebookData.name];
  constructor (scope: EditorCellScope, notebookData: app.INotebookData) {
    this._scope = scope;

    scope.active = false;
    scope.actions = this._createActionHandlers();
    scope.keymap = scope.getKeymap();
    scope.notebookData = notebookData;
  }

  // handle events that occur on the editor instance
  _createActionHandlers () {
    return {
      'focus': this.activate.bind(this)
    }
  }

  activate () {
    var that = this;
    this._scope.$evalAsync(() => {
      that._scope.notebookData.selectCell(that._scope.cell);
    });
  }

  deactivate () {
    // TODO(bryantd): Support programmatic cell deactivation.
    // Need to listen for blur event on the outer-most element of the editor cell
    // (the containing div) and use that event as the deactivate trigger.
    //
    // Then, invoke the nbdata.deactivateCell() method here
  }

}

function editorCellDirectiveLink (
    scope: EditorCellScope,
    element: ng.IAugmentedJQuery,
    attrs: any,
    controller: EditorCellController
    ): void {

  scope.$watch(() => {
    var activeCell = scope.notebookData.activeCell;
    // Avoid having the watch recursively compare all of the data within the cell by
    // returning the cell id as the watched value. If there is no active cell, any constant
    // sentinel value that is not also a valid cell id can be returned (using undefined here).
    return (activeCell && activeCell.id) || undefined;
  }, (newValue: any, oldValue: any) => {
      // Check to see if the cell for this directive has become active and update the scope
      // with the current active/inactive status.
      scope.active = (newValue === scope.cell.id);
  });
}

/**
 * Creates a directive definition.
 */
function editorCellDirective (): ng.IDirective {
  return {
    restrict: 'E',
    scope: {
      cell: '=',
      worksheetId: '=',
      getKeymap: '&keymap',
      enableEditRegion: '=',
      enablePreviewRegion: '=',
      onPreviewRegionDoubleClick: '&'
    },
    templateUrl: constants.scriptPaths.app + '/components/editorcell/editorcell.html',
    replace: true,
    controller: EditorCellController,
    link: editorCellDirectiveLink
  }
}

_app.registrar.directive(constants.editorCell.directiveName, editorCellDirective);
log.debug('Registered editor cell directive');
