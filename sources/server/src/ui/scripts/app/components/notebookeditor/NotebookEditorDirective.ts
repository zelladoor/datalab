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
/// <amd-dependency path="app/components/worksheeteditor/WorksheetEditorDirective" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import _app = require('app/App');


var log = logging.getLogger(constants.scopes.notebookEditor);

interface NotebookEditorScope extends ng.IScope {
  notebook?: app.notebook.Notebook;
  activeWorksheet?: app.notebook.Worksheet;
}

class NotebookEditorController {

  _scope: NotebookEditorScope;

  static $inject = ['$scope'];
  constructor (scope: NotebookEditorScope) {
    this._scope = scope;
    this.makeFirstWorksheetActive();
  }

  /**
   * Makes the first worksheet active, if it exists
   */
  makeFirstWorksheetActive () {
    if (this._scope.notebook.worksheetIds.length > 0) {
      this.selectWorksheet(this._scope.notebook.worksheetIds[0]);
    } else {
      log.error('Notebook contains zero worksheets!');
    }
  }

  selectWorksheet (worksheetId: string) {
    var worksheet = this._scope.notebook.worksheets[worksheetId];
    if (!worksheet) {
      log.error('Attempted to select non-existent worksheet id: ', worksheetId);
    }
    this._scope.activeWorksheet = worksheet;
  }

}

function notebookEditorDirective (): ng.IDirective {
  return {
    restrict: 'E',
    scope: {
      notebook: '='
    },
    replace: true,
    templateUrl: constants.scriptPaths.app + '/components/notebookeditor/notebookeditor.html',
    controller: NotebookEditorController
  }
}

_app.registrar.directive(constants.notebookEditor.directiveName, notebookEditorDirective);
log.debug('Registered notebook editor directive');
