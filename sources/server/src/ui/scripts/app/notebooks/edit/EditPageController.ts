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
/// <amd-dependency path="app/components/notebook/NotebookDirective" />
/// <amd-dependency path="app/components/editorcell/socketio" />
/// <amd-dependency path="app/components/session/Session" />
/// <amd-dependency path="app/components/notebookData/NotebookDataService" />
/// <amd-dependency path="app/components/markdowncell/MarkdownCellDirective" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import app = require('app/App');


var log = logging.getLogger(constants.scopes.notebooks.edit.page);

export class EditPageController {
  notebookData: any; // FIXME: type

  /**
   * The ID of the notebook to edit
   */
  notebookId: string;
  sessionStatus: any; // FIXME: TYPE

  _rootScope: ng.IRootScopeService;
  _requestId: string;
  _session: any;

  /**
   * Constructor and arguments for Angular to inject
   */
  static $inject: string[] = ['$routeParams', '$rootScope', 'notebookData', 'Socket', 'session'];
  constructor (
      routeParams: ng.route.IRouteParamsService,
      rootScope: ng.IRootScopeService,
      notebookData: any,
      socket: any,
      session: any) { // FIXME: types here
    this._rootScope = rootScope;
    this.notebookData = notebookData;
    this._session = session;

    this._configureSessionStatusHandlers();
  }

  // FIXME: move these to some "notebook toolbar" directive to avoid cluttering the page-level directive
  // FIXME: they should also delegate to notebook data service
  clearAllOutputs () {
    log.debug('TODO: clear all outputs');
  }
  executeNotebook () {
    log.debug('TODO: execute notebook');
  }


  // FIXME: relocate this into a sub-component? Seems noisy to have it top-level
  _configureSessionStatusHandlers () {
    // FIXME: list out the different values for session status somewhere, probably in the interface
    // file that defines the "datalab websocket api" between ui/node
    this.sessionStatus = {
      kernelStatus: 'starting'
    };
    var that = this;
    this._rootScope.$on('session-status', (event: any, sessionStatus: any) => {
      // FIXME: find other references of scope.$apply and see if they should be changed
      // to $evalAsync for digest loop conflict safety
      that._rootScope.$evalAsync(() => {
        that.sessionStatus = sessionStatus;
      });
    });
  }

}

app.registrar.controller(constants.notebooks.edit.pageControllerName, EditPageController);
log.debug('Registered ', constants.notebooks.edit.pageControllerName);
