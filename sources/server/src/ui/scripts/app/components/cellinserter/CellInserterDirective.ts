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
 * Directive for rendering a cell inserter widget
 */
/// <reference path="../../../../../../../../externs/ts/angularjs/angular.d.ts" />
/// <amd-dependency path="app/components/notebookdata/NotebookData" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import _app = require('app/App');


var log = logging.getLogger(constants.scopes.cellInserter);

interface CellInserterScope extends ng.IScope {
  notebookData: app.INotebookData;
  insertAfterCellId: string;
  worksheetId: string;
}

class CellInserterController {
  _notebookData: app.INotebookData;
  _rootScope: ng.IRootScopeService;
  _scope: CellInserterScope;

  static $inject = ['$rootScope', '$scope', constants.notebookData.name];
  constructor (
      rootScope: ng.IRootScopeService,
      scope: CellInserterScope,
      notebookData: app.INotebookData) {
    this._rootScope = rootScope;
    this._scope = scope;
    this._scope.notebookData = notebookData;
  }
}

function cellInserterDirective (): ng.IDirective {
  return {
    restrict: 'E',
    scope: {
      // TODO(bryantd): try to make these properties use one-way binding for efficiency
      insertAfterCellId: '=',
      worksheetId: '='
    },
    replace: true,
    controller: CellInserterController,
    templateUrl: constants.scriptPaths.app + '/components/cellinserter/cellinserter.html',
  }
}

_app.registrar.directive(constants.cellInserter.directiveName, cellInserterDirective);
log.debug('Registered cell inserter directive');
