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


/// <reference path="../../../../../../externs/ts/node/socket.io.d.ts" />
import socketio = require('socket.io');
import updates = require('../shared/updates');


/**
 * Implements server-side portion of client-server DataLab message protocol
 *
 * Instances of this class also own the socket.io socket instance for the user connection.
 *
 * Because type information is lost when messages are sent over socket.io connections
 * the message protocol implemented here uses the socket.io *event* name to carry type information.
 * This allows the messaging protocol be typed on both sides (without doing message introspection)
 * at the cost of having one event per type.
 */
export class UserConnection implements app.IUserConnection {

  id: string;

  _socket: socketio.Socket;

  constructor (id: string, socket: socketio.Socket) {
    this.id = id;
    this._socket = socket;
    this._registerHandlers()
  }

  getNotebookPath (): string {
    return this._socket.handshake.query.notebookPath;
  }

  /**
   * Registers a callback that is invoked whenever the user disconnects
   */
  onDisconnect (callback: app.EventHandler<app.IUserConnection>) {
    this._delegateDisconnectHandler = callback;
  }

  /**
   * Registers a callback to be invoked when a user sends a code execution request
   */
  onExecuteRequest (callback: app.EventHandler<app.ExecuteRequest>) {
    this._delegateExecuteRequestHandler = callback;
  }

  /**
   * Sends a session status update message to the user
   */
  sendSessionStatus (status: app.notebook.update.SessionStatus) {
    this._send(updates.notebook.sessionStatus, status);
  }

  /**
   * Sends a notebook snapshot update message to the user
   */
  sendSnapshot (snapshot: app.notebook.update.Snapshot) {
    this._send(updates.notebook.snapshot, snapshot);
  }

  _delegateExecuteRequestHandler (message: app.ExecuteRequest) {}

  _delegateDisconnectHandler (connection: app.IUserConnection) {}

  /**
   * Handles connection cleanup and delegates to registered event handler
   *
   * Invoked whenever a user disconnects from the server (e.g., closes/refreshes browser)
   */
  _handleDisconnect () {
    // Any connection-level cleanup/finalization goes here
    this._delegateDisconnectHandler(this);
  }

  /**
   * Validates that the received message is an ExecuteRequest and delegates
   */
  _handleExecuteRequest (message: any) {
    // Validate that the message is an ExecuteRequest (structurally)
    if (!message.requestId || !message.code) {
      // TODO(bryantd): make this an error-level message once logger supporting levels is added
      console.log('Malformed request for the execute request message: ', message);
      // TODO(bryantd): eventually emit some sort of error response to the front-end
    } else {
      this._delegateExecuteRequestHandler (<app.ExecuteRequest>message);
    }
  }

  /**
   * Register callbacks to handle events/messages arriving via socket.io connection
   */
  _registerHandlers () {
    this._socket.on('disconnect', this._handleDisconnect.bind(this));
    this._socket.on('execute', this._handleExecuteRequest.bind(this));
  }

  _send (type: string, message: any) {
    this._socket.emit(type, message);
  }
}
