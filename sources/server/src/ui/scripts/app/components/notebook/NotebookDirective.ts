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
/// <amd-dependency path="app/components/codecell/CodeCellDirective" />
/// <amd-dependency path="app/components/markdowncell/MarkdownCellDirective" />
/// <amd-dependency path="app/components/headingcell/HeadingCellDirective" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import app = require('app/App');


var log = logging.getLogger(constants.scopes.notebookEditor);

interface NotebookScope extends ng.IScope {
  notebook?: any; // FIXME: define type
  ctrl?: any;
}

// FIXME: RENAME  this file and the template to be notebook-editor
function notebookEditorDirective (): ng.IDirective {
  return {
    restrict: 'E',
    scope: {
      notebook: '='
    },
    replace: true,
    templateUrl: constants.scriptPaths.app + '/components/notebook/notebook.html',
  }
}

app.registrar.directive(constants.notebookEditor.directiveName, notebookEditorDirective);
log.debug('Registered notebook directive');
