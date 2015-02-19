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
import constants = require('app/common/Constants');
import logging = require('app/common/Logging');
import _app = require('app/App');


var log = logging.getLogger(constants.scopes.sessionConnection);

/**
 * Creates a (singleton) socket.io connection with wrappers for triggering the Angular digest cycle
 *
 * TODO(bryantd): Add ability to spawn a new session connection on route/location change, or add
 * the ability to disassociate this connection from the session and have it join a new session.
 */
function socketConnectionFactory (
    rootScope: ng.IRootScopeService,
    location: ng.ILocationService,
    route: ng.route.IRouteService) {

  var socket: Socket = socketio(location.host(), {
    // FIXME: any reason not to refer to the notebookId as notebookPath throughout UI-side too?
    query: 'notebookPath=' + route.current.params.notebookId
  });

  return {
    on: function (messageType: string, callback: app.SessionMessageHandler) {
      socket.on(messageType, function (message: any) {
        log.debug('socket.io on "' + messageType + '":', message);

        // Execute the given callback within a scope.$apply so that angular will
        // know about any variable updates (that it can then propagate).
        // TODO(bryantd): See if possible to do away with this forced digest cycle
        rootScope.$apply(function () {
          callback(message);
        });
      });
    },
    emit: function(messageType: string, message: any) {
      log.debug('socket.io emit "' + messageType + '":', message);
      socket.emit(messageType, message);
    }
  };
}
socketConnectionFactory.$inject = ['$rootScope', '$location', '$route'];


_app.registrar.factory(constants.sessionConnection.name, socketConnectionFactory);
log.debug('Registered socket connection factory');
