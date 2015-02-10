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
/// <amd-dependency path="app/components/session/SessionConnection" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import _app = require('app/App');
import actions = require('app/shared/actions');
import updates = require('app/shared/updates');
import uuid = require('app/common/uuid');


var log = logging.getLogger(constants.scopes.session);

//// FIXME REFACTOR this class becomes the "session event subscriber"
//// listens for any event that should be propagated to the server as a protocol msg over ws
//// Handles converting events to protocol messages (via components or directly)

//// FIXME REFACTOR this class also becomes the "session event publisher"
/// listens for any incoming messages over websocket and translates them to events

class Session implements app.ISession {
  _connection: app.ISessionConnection;
  _rootScope: ng.IRootScopeService;

  static $inject = ['$rootScope', constants.sessionConnection.name];
  constructor (rootScope: ng.IRootScopeService, connection: app.ISessionConnection) {
    this._connection = connection;
    this._rootScope = rootScope;

    var executeCellEvent = actions.cell.execute;
    this._rootScope.$on(executeCellEvent, this._handleExecuteCellEvent.bind(this));

    connection.on('session-status', function (message: any) {
      log.debug('session status', message);
      rootScope.$emit('session-status', message);
    });

    connection.on(updates.notebook.snapshot, this._handleSnapshot.bind(this));
  }

  _handleSnapshot (snapshot: app.notebook.update.Snapshot) {
    log.debug('notebook snapshot received:', snapshot);
    this._rootScope.$emit(updates.notebook.snapshot, snapshot);
  }

  _generateRequestId (): string {
    return uuid.v4();
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
    this._connection.emit('execute', msg);
    log.debug('sent execute', msg);
  }

}

_app.registrar.service(constants.session.name, Session);
log.debug('Registered ', constants.scopes.session);
