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
import updates = require('../shared/updates');
import actions = require('../shared/actions');


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
  _notebook: app.IActiveNotebook;
  _requestIdToCellRef: app.Map<app.CellRef>;

  /**
   * All messages flowing in either direction between user<->kernel will pass through this handler
   */
  _messageHandler: app.MessageHandler;

  constructor (
      id: string,
      userconn: app.IUserConnection,
      kernel: app.IKernel,
      notebook: app.IActiveNotebook,
      messageHandler: app.MessageHandler) {
    this.id = id;
    this._kernel = kernel;
    this._registerKernelEventHandlers();
    this._notebook = notebook;
    this._messageHandler = messageHandler;
    this._requestIdToCellRef = {};
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
    this._userconns.push(userconn); // FIXME: remove stale connections from this set on disconnect
    this._registerUserEventHandlers(userconn);

    // Send the initial notebook state at the time of connection
    userconn.sendUpdate({
      update: updates.notebook.snapshot,
      notebook: this._notebook.getSnapshot()
    });
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
   * Applies execute reply data to the notebook model and broadcasts an update message
   */
  _handleExecuteReplyPostDelegate (message: any) {
    var cellRef = this._getCellRefForRequestId(message.requestId);
    if (!cellRef) {
      // Nothing to update
      return;
    }

    // Convert the execution counter to a string to be used as a cell prompt
    var prompt = message.executionCounter.toString();

    var action: app.notebook.action.UpdateCell = {
      action: actions.cell.update,
      worksheetId: cellRef.worksheetId,
      cellId: cellRef.cellId,
      prompt: prompt
    };

    // Add the error messaging as an output if an error has occurred
    if (message.errorName) {
      action.outputs = [{
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

    var update = this._notebook.apply(action);
    this._broadcastUpdate(update);
  }

  _broadcastUpdate (update: app.notebook.update.Update) {
    this._userconns.forEach((userconn) => {
      userconn.sendUpdate(update);
    });
  }

  /**
   * Delegates an incoming action request (from user) to the middleware stack
   */
  _handleActionPreDelegate (request: app.ExecuteRequest) {
    var nextAction = this._handleActionPostDelegate.bind(this);
    this._messageHandler(request, this, nextAction);
  }
  /**
   * Handles the action request by updating the notebook model, issuing kernel requests, etc.
   */
  _handleActionPostDelegate (action: any) {
    switch (action.action) {
      case actions.composite:
        this._handleActionComposite(action);
      break;

      case actions.cell.execute:
        this._handleActionExecuteCell(action);
      break;

      case actions.notebook.executeCells:
        this._handleActionExecuteCells(action);
      break;

      case actions.cell.clearOutput:
      case actions.cell.update:
      case actions.worksheet.addCell:
      case actions.worksheet.deleteCell:
      case actions.worksheet.moveCell:
        this._handleActionNotebookData(action);
      break

      default:
        console.log('WARNING No handler for action message type "' + action.action + '"');
    }
  }

  _handleActionComposite (action: app.notebook.action.Composite) {
    // Process each of the sub-actions, in order
    action.subActions.forEach(this._handleActionPostDelegate.bind(this));
  }

  _handleActionNotebookData (action: app.notebook.action.UpdateCell) {
    var update = this._notebook.apply(action);
    // Update all clients about the notebook data change
    this._broadcastUpdate(update);
  }

  _handleActionExecuteCell (action: app.notebook.action.ExecuteCell) {
    var requestId = uuid.v4();

    // Store the mapping of request ID -> cellref for joining kernel response messages later
    this._setCellRefForRequestId(requestId, {
      cellId: action.cellId,
      worksheetId: action.worksheetId
    });

    var cell = this._notebook.getCell(action.cellId, action.worksheetId);
    if (!cell) {
      console.log('ERROR Attempted to execute non-existent cell with id: ' + action.cellId);
      return;
    }

    // Request that the kernel execute the code chunk
    this._kernel.execute({
      requestId: requestId,
      cellId: action.cellId,
      code: cell.source
    });
  }

  _handleActionExecuteCells (action: app.notebook.action.ExecuteCells) {
    var notebookData = this._notebook.getSnapshot();
    // Execute all cells in each worksheet
    notebookData.worksheetIds.forEach((worksheetId) => {
      notebookData.worksheets[worksheetId.cells.forEach((cell) => {
          this._handleActionExecuteCell({
          worksheetId: worksheetId,
          cellId: cell.id
        });
      });
    });
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
    this._broadcastUpdate({
      update: updates.notebook.sessionStatus,
      // TODO: add other session metdata here such as connected users, etc. eventually
      kernelState: message.status
    });
  }

  _handleOutputDataPreDelegate (outputData: app.OutputData) {
    var nextAction = this._handleOutputDataPostDelegate.bind(this);
    this._messageHandler(outputData, this, nextAction);
  }
  _handleOutputDataPostDelegate (message: any) {
    var cellRef = this._getCellRefForRequestId(message.requestId);
    if (!cellRef) {
      // Nothing to update
      return;
    }

    // Apply the output data update to the notebook model
    var update = this._notebook.apply({
      action: actions.cell.update,
      worksheetId: cellRef.worksheetId,
      cellid: cellRef.cellId,
      outputs: [{
        type: message.type,
        mimetypeBundle: message.mimetypeBundle
      }]
    });

    // Broadcast the update
    this._broadcastUpdate(update);
  }

  _registerUserEventHandlers (userconn: app.IUserConnection) {
    userconn.onAction(this._handleActionPreDelegate.bind(this));
  }

  _registerKernelEventHandlers () {
    this._kernel.onExecuteReply(this._handleExecuteReplyPreDelegate.bind(this));
    this._kernel.onKernelStatus(this._handleKernelStatusPreDelegate.bind(this));
    this._kernel.onOutputData(this._handleOutputDataPreDelegate.bind(this));
  }

  /* Methods for managing request <-> cell reference mappings */

  /**
   * Gets the cell id that corresponds to the given request id
   *
   * Returns null if the given request id has no corresponding cell id recorded
   */
  _getCellRefForRequestId (requestId: string) {
    var cellRef = this._requestIdToCellRef[requestId];
    if (cellRef) {
      return cellRef;
    } else {
      // TODO: should be an error-level message when levels are supported
      console.log('ERROR: Request for unknown cell ref arrived request='
        + requestId + ', cell ref=' + JSON.stringify(cellRef) + ': ignoring message...');
      return null;
    }
  }

  /**
   * Stores the mapping of request ID to cellref
   *
   * The kernel doesn't know anything about cells or notebooks, just requests, so this mapping
   * allows response/reply messages from the kernel to be mapped to the corresponding cell
   * that should be updated.
   */
  _setCellRefForRequestId (requestId: string, cellRef: app.CellRef) {
    // FIXME: need to implement some policy for removing request->cell mappings
    // when they are no longer needed. Ideally there'd be a way to guarantee
    // that a request will have no further messages.
    //
    // Worst case implement something like a fixed-size LRU cache to avoid growing without bound,
    // or evict request IDs based upon a TTL value.
    //
    // Best case would be to somehow store the cell reference within the kernel request message
    // and have the cell reference returned in all replies to that message. This would rely upon
    // adding an extra field to the ipython message header, which is then returned as the
    // "parent header" in all reply messages. If all kernels simply copy the header data to parent
    // header in responses, this will work, but needs verification. Since a generic header metadata
    // dict isn't part of the current message spec, there are likely no guarantees w.r.t.
    // additional/non-standard header fields.
    //
    // Another option would be to serialize the cell reference to string and use that for the
    // request id. All responses would include the parent request id, which could then be
    // deserialized back into a cell reference.
    this._requestIdToCellRef[requestId] = cellRef;
  }
}
