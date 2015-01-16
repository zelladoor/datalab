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
/// <amd-dependency path="app/components/kernel/KernelService" />
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
  _kernel: any; // FIXME: type, also this should be a "session" interface/object eventually

  /**
   * Constructor and arguments for Angular to inject
   */
  static $inject: string[] = ['$routeParams', '$rootScope', 'notebookData', 'Socket', 'kernel'];
  constructor (
      routeParams: ng.route.IRouteParamsService,
      rootScope: ng.IRootScopeService,
      notebookData: any,
      socket: any,
      kernel: any) {
    this._rootScope = rootScope;
    this.notebookData = notebookData;
    this._kernel = kernel;

    // FIXME: get the id from the url route param
    //     this.notebookId = routeParams['notebookId'];
    // just use a single fake notebook id on all page loads for now
    //
    // Then this notebook id should be used to somehow tell the server which notebook content to load
    // from the persistence backend (i.e., GCS or vm filesystem/PD)
    //
    // TODO(bryantd): implement a message type for setting the current notebook based upon the route/id
    // Such a "load-notebook" message type will be issued anytime this controller is constructd, which happens
    // whenever the url route/notebook changes. This controller should be constructed on each notebook
    // page view, which means we can do the work of sending the "load-notebook"
    // message as part of the constructor init possibly.
    //
    // Need to also avoid the case where the NotebookData service still has a previous notebook in memory
    // (and therefore wired into this view) between when this controller is constructed and the newly loaded
    // notebook has been (re)broadcast from the server. Probably can handle with some sort of "ready" flag
    // that starts off false and then is set to true when the notebook loads. Use the "ready" flag to
    // cloak the directive content until the correct/new content is available

    // FIXME: list out the different values for session status somewhere, probably in the interface
    // file that defines the "datalab websocket api" between ui/node
    this.sessionStatus = {
      kernelStatus: 'starting'
    };

    var that = this;
    rootScope.$on('session-status', (event: any, sessionStatus: any) => {
      // FIXME: find other references of scope.$apply and see if they should be changed
      // to $evalAsync for digest loop conflict safety
      rootScope.$evalAsync(() => {
        that.sessionStatus = sessionStatus;
      });
    });
  }

  // FIXME: move these to some "notebook toolbar" directive to avoid cluttering the page-level directive
  clearAllOutputs () {
    log.debug('TODO: clear all outputs');
  }
  executeNotebook () {
    log.debug('TODO: execute notebook');
  }

}

app.registrar.controller(constants.notebooks.edit.pageControllerName, EditPageController);
log.debug('Registered ', constants.notebooks.edit.pageControllerName);
