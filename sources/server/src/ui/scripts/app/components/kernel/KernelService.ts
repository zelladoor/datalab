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
 * FIXME: docs here
 */
/// <reference path="../../../../../../../../externs/ts/angularjs/angular.d.ts" />
/// <amd-dependency path="app/components/editorcell/socketio" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import app = require('app/App');
import actions = require('app/shared/actions');
import updates = require('app/shared/updates');


var log = logging.getLogger(constants.scopes.kernel);

//// FIXME REFACTOR this class becomes the "session event subscriber"
//// listens for any event that should be propagated to the server as a protocol msg over ws
//// Handles converting events to protocol messages (via components or directly)

//// FIXME REFACTOR this class also becomes the "session event publisher"
/// listens for any incoming messages over websocket and translates them to events

class Kernel { // FIXME RENAME this to "Session" or something like that
  _socket: any; // FIXME TYPE
  _rootScope: ng.IRootScopeService;
  _nextRequestId: number; // FIXME: replace with uuid generation

  // FIXME: use the constants.compoents.socket var instead of str const name here
  static $inject = ['$rootScope', 'Socket'];
  constructor (rootScope: ng.IRootScopeService, socket: any) {
    this._socket = socket;
    this._rootScope = rootScope;

    this._nextRequestId = 1; // Execution counter starts from 1 within ipy kernel
    var executeCellEvent = actions.cell.execute;
    this._rootScope.$on(executeCellEvent, this._handleExecuteCellEvent.bind(this));
    socket.on('notebook-update', this._handleNotebookUpdate.bind(this));
    socket.on('session-status', function (socket: any, message: any) {
      log.debug('session status', message);
      rootScope.$emit('session-status', message);
    });
    socket.on(updates.notebook.snapshot, function (socket: any, message: any) {
      log.warn('NOTEBOOK SNAPSHOT message: ', message);
    })
  }

  _handleNotebookUpdate (socket: any, notebookUpdate: any) {
    log.debug('notebook-update event received:', notebookUpdate);
    this._rootScope.$emit('notebook-update', notebookUpdate);
  }

  _generateRequestId (): string {
    return '' + this._nextRequestId++;
  }

  _handleExecuteCellEvent (event: ng.IAngularEvent, cell: any) {
    log.debug('Processing cell.execute event', event, cell);
    this._rootScope.$apply(() => {
      // FIXME: is this the best object to be modifying the cell-level notebook data?
      // Feel like this could be better encapsulated somewhere else (maybe notebook data service?)
      cell.executionCounter = '*';
    });
    var msg: any = {
      code: cell.source,
      cellId: cell.id,
      requestId: this._generateRequestId()
    };
    this._socket.emit('execute', msg);
    log.debug('sent execute', msg);
  }

}

app.registrar.service('kernel', Kernel);
log.debug('Registered ', constants.scopes.kernel);
