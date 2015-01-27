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


/// <reference path="../../../../../../../../externs/ts/angularjs/angular.d.ts" />
/// <reference path="../../../../../../../../externs/ts/socket.io.d.ts" />
import socketio = require('socketio');
import logging = require('app/common/Logging');
import app = require('app/App');


var log = logging.getLogger('socket-factory');

// FIXME: bunch of typing issues being ignored for now
/**
 * Creates a (singleton) socket.io connection with wrappers for triggering the Angular digest cycle
 *
 * TODO(bryantd): Current socket factory provides only a singleton, but we'll need one per "datalab channel" eventually;
 * need to refactor this "angular factory" to be an object with a createSocket() method.
 */
function socketFactory (rootScope: ng.IRootScopeService, window, route) {

  // FIXME: any reason not to refer to the notebookId as notebookPath throughout UI-side too?
  var socket: Socket = socketio(window.location.origin, {
    query: 'notebookPath=' + route.current.params.notebookId
  });

  return {
    on: function (message: string, callback: Function) {
      socket.on(message, function (data: any) {
        // Execute the given callback within a scope.$apply so that angular will
        // know about any variable updates (that it can then propagate).
        rootScope.$apply(function () {
          callback(socket, data);
        });
      });
    },
    emit: function(message: string, data: any) { // FIXME: should rename message to event or something consistent with node
      socket.emit(message, data);
    }
  };
}
socketFactory.$inject = ['$rootScope', '$window', '$route'];


app.registrar.factory('Socket', socketFactory);
log.debug('Registered editor cell directive');
