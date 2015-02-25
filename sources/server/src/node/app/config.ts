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


/// <reference path="../../../../../externs/ts/express/express.d.ts" />
/// <reference path="../../../../../externs/ts/node/mkdirp.d.ts" />
import express = require('express');
import mkdirp = require('mkdirp');
import kernels = require('./kernels/index');
import storage = require('./storage/local');
import notebooks = require('./notebooks/index');

/**
 * Default server configuration with support for environment variable overrides.
 *
 * TODO(bryantd): This should be configured from an external settings file eventually
 */
var settings: app.Settings = {
  httpPort: parseInt(process.env['SERVER_HTTP_PORT'] || 9000)
};

/**
 * Gets the set of HTTP API route handlers that should be enabled for the server.
 */
export function getApiRouter (): express.Router {
  var kernelApi = new kernels.Api(kernelManager);
  var apiRouter: express.Router = express.Router();
  kernelApi.register(apiRouter);
  // TODO(bryantd): register notebooks/datasets/other APIs here eventually

  return apiRouter;
}

/**
 * A single, server-wide kernel manager instance
 */
var kernelManager: app.IKernelManager = new kernels.Manager();

/**
 * Gets the kernel manager singleton
 */
export function getKernelManager (): app.IKernelManager {
  return kernelManager;
}

/**
 * Logs all messages to the console
 */
function logMessage (message: any, session: app.ISession): any {
  console.log('Message: ', JSON.stringify(message));
  return message;
}

function processSessionRename (
    message: any,
    session: app.ISession,
    sessionManager: app.ISessionManager): any {
  // For any notebook rename messages, also update the session id to match
  if (message.action == actions.notebook.rename) {
    if (!message.path) {
      throw new Error('Invalid session id for renaming "'+message.path+'"');
    }
    sessionManager.rename(session.id, message.path);
  }
  return message;
}

/**
 * Gets the ordered list of message processors
 */
export function getMessageProcessors (): app.MessageProcessor[] {
  return [
    logMessage,
    processSessionRename
  ];
}

export function getSettings (): app.Settings {
  return settings;
}

/**
 * Gets a notebook serializer instance
 */
export function getNotebookSerializer (): app.INotebookSerializer {
  return notebooks.serializer;
}

/**
 * Path to the root of the notebook storage location on the local file system
 */
var notebookStoragePath = './notebooks';
export function initStorage () {
  mkdirp.sync(notebookStoragePath);
}

/**
 * A single, server-wide storage backend instance
 */
var fsStorage = new storage.LocalFileSystemStorage(notebookStoragePath);

/**
 * Get the configured storage backend for persisting content (e.g., notebooks)
 */
export function getStorage (): app.IStorage {
  return fsStorage;
}
