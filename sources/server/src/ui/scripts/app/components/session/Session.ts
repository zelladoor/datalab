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

/**
 * Manages the two-way connection between client and server and associated session message traffic
 *
 * Publishes incoming messages (from the server) as client-side events.
 *
 * Subscribes to client-side event types that map to session messages and forwards these
 * messages to the server (with some transformation/message wrapping applied)
 */
class Session implements app.ISession {

  _connection: app.ISessionConnection;
  _rootScope: ng.IRootScopeService;

  static $inject = ['$rootScope', constants.sessionConnection.name];
  constructor (rootScope: ng.IRootScopeService, connection: app.ISessionConnection) {
    this._connection = connection;
    this._rootScope = rootScope;

    // Register server-side message handlers
    connection.on(updates.label, this._handleUpdate.bind(this));

    // Register client-side event handlers for each action scope
    [actions.cell, actions.notebook, actions.worksheet].forEach((actionScope) => {
      Object.keys(actionScope).forEach((action) => {
        // Add an event listener for each action type
        this._rootScope.$on(actionScope[action], this._handleAction.bind(this));
      }, this);
    }, this);
  }

  /**
   * Handles action messages by forwarding them to the server
   */
  _handleAction (event: ng.IAngularEvent, action: app.notebook.action.Action) {
    log.debug('Sending action to server', action);
    this._connection.emit('action', action);
  }

  /**
   * Handles all incoming server updates by publishing them as client-side events
   */
  _handleUpdate (update: app.notebook.update.Update) {
    log.debug('update message received:', update);
    this._rootScope.$emit(update.update, update);
  }
}

_app.registrar.service(constants.session.name, Session);
log.debug('Registered ', constants.scopes.session);
