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
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import app = require('app/App');

// FIXME: remove the codemirror dep if type is factored out
// Try to avoid the codemirror types bleeding out of the code editor directive if possible

// FIXME: rename this "cell editor" since it is a UI for editing cell data (of any type)
// Likewise, rename the markdown version that builds on top of this "markdown editor"

var log = logging.getLogger(constants.scopes.editorCell);

interface MyScope extends ng.IScope { // FIXME: naming convention for local scopes that are never externalized
  cell: any;
  keymap?: any;
  actions?: any;
}

class Ctrl {

  _eventScope: ng.IRootScopeService;
  _scope: MyScope;

  static $inject: string[] = ['$scope', '$rootScope', 'Socket'];
  constructor (scope: MyScope, rootScope: ng.IRootScopeService, socket: any) {
    this._scope = scope;
    this._eventScope = rootScope;

    scope.keymap = this._createKeymap();
    scope.actions = this._createActionHandlers();
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

  _createKeymap () {
    return {
      'Shift-Enter': this._handleExecute.bind(this),
    };
  }

  // FIXME: move event name string constants to constants file and put these particular constants
  // somewhere that the node and ui-side code can access/build against. These event names and messages
  // are effectively the "datalab websocket api" and should be well documented
  _handleExecute (cm: CodeMirror.Editor) {
    this._eventScope.$emit('execute-cell', this._scope.cell);
  }

}

/**
 * Creates a directive definition.
 */
function editorCellDirective (): ng.IDirective {
  return {
    restrict: 'E',
    scope: {
      cell: '='
    },
    templateUrl: constants.scriptPaths.app + '/components/editorcell/editorcell.html',
    replace: true,
    controller: Ctrl
  }
}

app.registrar.directive(constants.editorCell.directiveName, editorCellDirective);
log.debug('Registered editor cell directive');
