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
/// <reference path="../../../../../../../../externs/ts/codemirror/codemirror.d.ts" />
/// <amd-dependency path="app/components/codeeditor/CodeEditorDirective" />
/// <amd-dependency path="app/components/celltoolbar/CellToolbarDirective" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import _app = require('app/App');

// FIXME: remove the codemirror dep if type is factored out
// Try to avoid the codemirror types bleeding out of the code editor directive if possible

// FIXME: rename this "cell editor" since it is a UI for editing cell data (of any type)
// Likewise, rename the markdown version that builds on top of this "markdown editor"

var log = logging.getLogger(constants.scopes.editorCell);

interface EditorCellScope extends ng.IScope {
  cell: app.notebook.Cell;
  worksheetId: string;
  getKeymap?: any;
  enableEditRegion?: boolean;
  enablePreviewRegion?: boolean;
  onPreviewRegionDoubleClick?: Function;

  keymap?: any;
  actions?: any;
}

class EditorCellController {

  _scope: EditorCellScope;

  static $inject = ['$scope'];
  constructor (scope: EditorCellScope) {
    this._scope = scope;

    scope.actions = this._createActionHandlers();
    scope.keymap = scope.getKeymap(); // FIXME: see if possible to just pass the getter function through
  }

  // handle events that occur on the editor instance
  _createActionHandlers () {
    return {
      'focus': this._handleFocus.bind(this),
      'blur': this._handleBlur.bind(this)
    }
  }

  _setActive (isActive: boolean) {
    var scope = this._scope;
    scope.$evalAsync(() => {
      scope.cell.active = isActive;
    });
  }

  _handleFocus () {
    this._setActive(true);
  }

  _handleBlur () {
    this._setActive(false);
  }

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
    controller: EditorCellController
  }
}

_app.registrar.directive(constants.editorCell.directiveName, editorCellDirective);
log.debug('Registered editor cell directive');
