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
import app = require('app/App');


var log = logging.getLogger(constants.scopes.sessionConnection);

/**
 * Creates a (singleton) socket.io connection with wrappers for triggering the Angular digest cycle
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
    on: function (event: string, callback: Function) {
      socket.on(event, function (message: any) {
        // Execute the given callback within a scope.$apply so that angular will
        // know about any variable updates (that it can then propagate).
        rootScope.$apply(function () {
          callback(socket, message);
        });
      });
    },
    emit: function(event: string, message: any) {
      socket.emit(event, message);
    }
  };
}
socketConnectionFactory.$inject = ['$rootScope', '$location', '$route'];


app.registrar.factory(constants.sessionConnection.name, socketConnectionFactory);
log.debug('Registered socket connection factory');
