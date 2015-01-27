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

/// <reference path="../../../../../../externs/ts/node/node-uuid.d.ts" />
import uuid = require('node-uuid');
import utils = require('../common/util');
import sessions = require('./session');
import notebooks = require('../notebooks/notebook');


/**
 * Manages the lifecycles of a set of sessions between users and kernels
 *
 * When a user connects, the session manager specifies which session the user should
 * join, which may involve creating a new session or joining an existing one.
 *
 * In short, the session manager contains all of the business logic for how to bind together
 * users and kernels into session objects.
 */
export class SessionManager {

  _idToSession: app.Map<app.ISession>;
  _kernelManager: app.IKernelManager;
  _messageProcessors: app.MessageProcessor[];
  _storage: app.IStorage;
  _userconnManager: app.IUserConnectionManager;

  constructor (
      userconnManager: app.IUserConnectionManager,
      kernelManager: app.IKernelManager,
      storage: app.IStorage,
      messageProcessors: app.MessageProcessor[]) {
    this._userconnManager = userconnManager;
    this._kernelManager = kernelManager;
    this._storage = storage;
    this._messageProcessors = messageProcessors;

    this._idToSession = {};
    this._registerHandlers();
  }

  /**
   * Binds the user connection to a new kernel instance via a newly created session object
   */
  _createSession (sessionId: string, connection: app.IUserConnection) {
    var kernel = this._kernelManager.create({
      iopubPort: utils.getAvailablePort(),
      shellPort: utils.getAvailablePort()
    });

    var notebook = new notebooks.ActiveNotebook(connection.getNotebookPath(), this._storage);

    return new sessions.Session(
      sessionId,
      connection,
      kernel,
      notebook,
      this._handleMessage.bind(this));
  }

  /**
   * Gets the session id for the given user connection
   */
  _getSessionId (connection: app.IUserConnection): string {
    // TODO(bryantd): evaluate if there are any cases where the sessionId really needs to be a uuid
    //
    // For now, ensure that all use cases of the session ID only assume it to be a opaque
    // string-based identifier so that it's trivial to switch to something like uuid.v5 in the
    // future; uuid.v4 is not suitable here because the goal is for any client that wants to edit
    // a specific notebook (uniquely identified by notebookPath) to share a single session. Thus
    // uuid.v5(notebookPath) would be one way of ensuring session id collision whenever the
    // notebookPath is the same for multiple clients, while still having a fixed-size, known
    // character-set, string-based identifier.
    //
    // Note: because sessionId may change to something other than the notebookPath in the future
    // a separate notebookPath field is passed
    return connection.getNotebookPath();
  }

  /**
   * Receives and processes all messages flowing through all sessions owned by this instance
   *
   * Session objects that pass control to this method also supply a "next action" callback for
   * returning control to the session after the middleware stack has had an opportunity
   * to manipulate a given message.
   */
  _handleMessage (message: any, session: app.ISession, callback: app.EventHandler<any>) {
    // Invoke each handler in the chain in order.
    //
    // If a handler returns null, the the message is considered "filtered" and processing
    // of the message stops.
    var processedMessage = message;
    for (var i = 0; i < this._messageProcessors.length; ++i) {
      processedMessage = this._messageProcessors[i](processedMessage, session);
      if (processedMessage === null) {
        // Then this message has been filtered, no further processing
        console.log('Filtered: ', JSON.stringify(message));
        break;
      }
    }

    // Return control to the messaging stack via Session object that corresponds to this message
    // if the message was not filtered by one of the message handlers
    if (processedMessage !== null) {
      callback(processedMessage);
    }
  }

  /**
   * Binds the new user connection to a session and configures session event handling
   *
   * If the session for the given connection already exists, the new connection reconnects to the
   * existing session.
   */
  _handleUserConnect (connection: app.IUserConnection) {
    var sessionId = this._getSessionId(connection);
    var session = this._idToSession[sessionId];
    if (!session) {
      // Create a brand new session object
      session = this._createSession(sessionId, connection);
      this._idToSession[sessionId] = session;
    } else {
      // Update existing session object with new user connection
      session.updateUserConnection(connection);
    }
  }

  _handleUserDisconnect (connection: app.IUserConnection) {
    // TODO(bryantd): implement procedure for tear down after user disconnect such that if the
    // same user (as identified by session id) reconnects, the previous kernel instance is re-used,
    // (i.e., implement disconnect such that reconnect is possible).
  }

  _registerHandlers () {
    this._userconnManager.onConnect(this._handleUserConnect.bind(this));
    this._userconnManager.onDisconnect(this._handleUserDisconnect.bind(this));
  }
}
