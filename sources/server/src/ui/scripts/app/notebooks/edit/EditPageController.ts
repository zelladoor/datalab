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
 * Top-level page controller for the notebook editing page
 */
/// <reference path="../../../../../../../../externs/ts/angularjs/angular.d.ts" />
/// <amd-dependency path="app/components/worksheeteditor/WorksheetEditorDirective" />
/// <amd-dependency path="app/components/session/Session" />
/// <amd-dependency path="app/components/notebookdata/NotebookData" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import _app = require('app/App');
import actions = require('app/shared/actions');


var log = logging.getLogger(constants.scopes.notebooks.edit.page);

export class EditPageController {
  notebookData: app.INotebookData;
  notebookId: string; // The ID of the notebook to edit
  sessionStatus: any; // FIXME: TYPE

  _rootScope: ng.IRootScopeService;
  _requestId: string;
  _session: app.ISession;

  /**
   * Constructor and arguments for Angular to inject
   */
  static $inject: string[] = ['$routeParams', '$rootScope', constants.notebookData.name, constants.session.name];
  constructor (
      routeParams: ng.route.IRouteParamsService,
      rootScope: ng.IRootScopeService,
      notebookData: any,
      session: app.ISession) {
    this._rootScope = rootScope;
    this.notebookData = notebookData;
    this._session = session;

    this._configureSessionStatusHandlers();
  }

  // FIXME: move these to some "notebook toolbar" directive to avoid cluttering the page-level directive
  // FIXME: they should also delegate to notebook data service
  clearAllOutputs () {
    var clearOutputsAction: app.notebook.action.ClearOutputs = {
      action: actions.notebook.clearOutputs
    };
    this._rootScope.$emit(actions.notebook.clearOutputs, clearOutputsAction);
  }
  executeCells () {
    var executeCellsAction: app.notebook.action.ExecuteCells = {
      action: actions.notebook.executeCells
    };
    this._rootScope.$emit(actions.notebook.executeCells, executeCellsAction);
  }


  // FIXME: relocate this into a sub-component? Seems noisy to have it top-level
  _configureSessionStatusHandlers () {
    // FIXME: re-enable and refactor once this message is being sent by server
    //
    // // FIXME: list out the different values for session status somewhere and replace string constant
    // this.sessionStatus = {
    //   kernelStatus: 'starting'
    // };
    // var that = this;
    // this._rootScope.$on('session-status', (event: any, sessionStatus: any) => {
    //   // FIXME: find other references of scope.$apply and see if they should be changed
    //   // to $evalAsync for digest loop conflict safety
    //   that._rootScope.$evalAsync(() => {
    //     that.sessionStatus = sessionStatus;
    //   });
    // });
  }

}

_app.registrar.controller(constants.notebooks.edit.pageControllerName, EditPageController);
log.debug('Registered ', constants.notebooks.edit.pageControllerName);
