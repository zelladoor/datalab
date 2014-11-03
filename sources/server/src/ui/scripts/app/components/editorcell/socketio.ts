// FIXME: hacking up the socket.io bits here

/// <reference path="../../../../../../../../externs/ts/angularjs/angular.d.ts" />
/// <reference path="../../../../../../../../externs/ts/socket.io.d.ts" />
import socketio = require('socketio');
import logging = require('app/common/Logging');
import app = require('app/App');


var log = logging.getLogger('socket-factory');

// FIXME: bunch of typing issues being ignored fro now
function socketFactory (rootScope: ng.IRootScopeService) {
  var socket: Socket = socketio();
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
socketFactory.$inject = ['$rootScope']


app.registrar.factory('Socket', socketFactory);
log.debug('Registered editor cell directive');


// FIXME: Current socket factory provides only a singleton, but we'll need one per "datalab channel" eventually;
// need to refactor this "angular factory" to be an object with a createSocket() method (i.e., a "real factory").
