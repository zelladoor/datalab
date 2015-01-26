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
 * Binds a user connection to a kernel and routes communication between them
 *
 * A session also provides hooks for routing messages through the message pipeline/middleware
 * before sending the messages to their final destination (either kernel or user).
 */
export class Session implements app.ISession {

  id: string;

  _kernel: app.IKernel;
  _userconns: app.IUserConnection[];
  _notebook: app.notebook.IActiveNotebook;
  _storage: app.IStorage;
  _requestIdToCellId: app.Map<string>;

  /**
   * All messages flowing in either direction between user<->kernel will pass through this handler
   */
  _messageHandler: app.MessageHandler;

  constructor (
      id: string,
      userconn: app.IUserConnection,
      kernel: app.IKernel,
      notebook: app.notebook.IActiveNotebook,
      storage: app.IStorage,
      messageHandler: app.MessageHandler) {
    this.id = id;
    this._kernel = kernel;
    this._registerKernelEventHandlers();
    this._notebook = notebook;
    this._storage = storage;
    this._messageHandler = messageHandler;
    this._requestIdToCellId = {};
    this._userconns = [];
    this.updateUserConnection(userconn);
  }

  getKernelId (): string {
    return this._kernel.id;
  }

  getUserConnectionIds (): string[] {
    return this._userconns.map((userconn) => {
      return userconn.id;
    });
  }

  /**
   * Updates the user connection associated with this session.
   *
   * A user connection update might occur when a user refreshes their browser, resulting in
   * destruction of previously establishd user<->server connection.
   *
   * This method allows a user to reestablish connection with an existing/running kernel.
   */
  updateUserConnection (userconn: app.IUserConnection) {
    this._userconns.push(userconn);
    this._registerUserEventHandlers(userconn);
    // Send the initial notebook state at the time of connection
    userconn.sendNotebookUpdate(this._notebook.getData());
    // console.log('!! New connection for session ' + this.id + ':\n' + JSON.stringify(this._userconns));
  }

  /**
   * Gets the cell id that corresponds to the given request id
   *
   * Returns null if the given request id has no corresponding cell id recorded
   */
  _getCellId (requestId: string) {
    var cellId = this._requestIdToCellId[requestId];
    if (cellId) {
      return cellId;
    } else {
      // TODO: should be an error-level message when levels are supported
      console.log('ERROR: Request for unknown cell id arrived request='
        + requestId + ', cellid=' + cellId + ': ignoring message...');
      return null;
    }
  }

  // Handlers for messages flowing in either direction between user<->kernel
  //
  // Each of the following methods delegates an incoming message to the middleware stack and
  // sets up a (post-delegation) callback to forward the message to the appropriate entity
  // (where "entity" is either a kernel or a user connection).

  /**
   * Delegates an incoming execute reply (from kernel) to the middleware stack
   */
  _handleExecuteReplyPreDelegate (reply: app.ExecuteReply) {
    var nextAction = this._handleExecuteReplyPostDelegate.bind(this);
    this._messageHandler(reply, this, nextAction);
  }
  /**
   * Forwards the execute reply to the user, post-middleware stack processing
   */
  _handleExecuteReplyPostDelegate (message: any) {
    var cellId = this._getCellId(message.requestId);
    if (!cellId) {
      // Nothing to update
      return;
    }

    var cellUpdate = {
      id: cellId,
      executionCounter: message.executionCounter.toString(),
      outputs: []
    };

    // Add the error messaging as an output if an error has occurred
    if (message.errorName) {
      cellUpdate.outputs = [{
        type: 'error',
        mimetypeBundle: {
          // TODO(bryantd): parse and present the traceback data as well
          // Hopefully there's a configuration setting for getting back html
          // traceback data rather than the escape-code formatted traceback
          //
          // Look at the --colors='NoColor' argument to the kernel to see if can be disabled there?
          // also the --no-color-info flag, also --no-pprint
          'text/plain': message.errorName + ': ' + message.errorMessage
        }
      }];
    }


    var notebookUpdate = this._notebook.updateCell(cellUpdate);
    this._broadcastNotebookUpdate(notebookUpdate);
  }

  _broadcastNotebookUpdate (notebookUpdate: any) {
    this._userconns.forEach((userconn) => {
      userconn.sendNotebookUpdate(notebookUpdate);
    });
  }
  _broadcastSessionStatus (status: app.SessionStatus) {
    this._userconns.forEach((userconn) => {
      userconn.sendSessionStatus(status);
    });
  }

  /**
   * Delegates an incoming execute request (from user) to the middleware stack
   */
  _handleExecuteRequestPreDelegate (request: app.ExecuteRequest) {
    var nextAction = this._handleExecuteRequestPostDelegate.bind(this);
    this._messageHandler(request, this, nextAction);
  }
  /**
   * Forwards execute request to the kernel, post-middleware stack processing
   */
  _handleExecuteRequestPostDelegate (message: any) {
    // Keep track of which cell id to map a given request id to
    // The kernel doesn't know anything about cells/notebooks, just requests
    //
    // FIXME: need to implement some policy for removing request->cell mappings
    // when they are no longer needed. Ideally there'd be a way to guarantee
    // that a request will have no further messages.
    // Worst case implement something like a fixed-size LRU cache to avoid growing without bound
    this._requestIdToCellId[message.requestId] = message.cellId;

    // Note that the following will also clear the list of cell outputs implicitly
    var notebookUpdate = this._notebook.putCell({
      id: message.cellId,
      type: 'code',
      source: message.code
    });

    // Update all clients about the notebook data change
    this._broadcastNotebookUpdate(notebookUpdate);
    // Request that the kernel execute the code chunk
    this._kernel.execute(message);
  }

  /**
   * Delegates in incoming kernel status (from kernel) to the middleware stack
   */
  _handleKernelStatusPreDelegate (status: app.KernelStatus) {
    var nextAction = this._handleKernelStatusPostDelegate.bind(this);
    this._messageHandler(status, this, nextAction);
  }
  /**
   * Forwards the kernel status to the user, post-middleware stack processing
   */
  _handleKernelStatusPostDelegate (message: any) {
    this._broadcastSessionStatus({
      // TODO: add other session metdata here such as connected users, etc. eventually
      kernelStatus: message.status
    });
  }

  _handleOutputDataPreDelegate (outputData: app.OutputData) {
    var nextAction = this._handleOutputDataPostDelegate.bind(this);
    this._messageHandler(outputData, this, nextAction);
  }
  _handleOutputDataPostDelegate (message: any) {
    var cellId = this._getCellId(message.requestId);
    if (!cellId) {
      // Nothing to update
      return;
    }

    // Publish the output data to the notebook model
    var notebookUpdate = this._notebook.updateCell({
      id: cellId,
      outputs: [{
        type: message.type,
        mimetypeBundle: message.mimetypeBundle
      }]
    });
    this._broadcastNotebookUpdate(notebookUpdate);
  }

  _registerUserEventHandlers (userconn: app.IUserConnection) {
    userconn.onExecuteRequest(this._handleExecuteRequestPreDelegate.bind(this));
  }

  _registerKernelEventHandlers () {
    this._kernel.onExecuteReply(this._handleExecuteReplyPreDelegate.bind(this));
    this._kernel.onKernelStatus(this._handleKernelStatusPreDelegate.bind(this));
    this._kernel.onOutputData(this._handleOutputDataPreDelegate.bind(this));
  }
}
