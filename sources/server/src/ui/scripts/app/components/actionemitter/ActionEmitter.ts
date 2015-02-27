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
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import actions = require('app/shared/actions');
import uuid = require('app/common/uuid');
import cells = require('app/shared/cells');
import _app = require('app/App');


var log = logging.getLogger(constants.scopes.actionEmitter);

class ActionEmitter implements app.IActionEmitter {

  _rootScope: ng.IRootScopeService;

  static $inject = ['$rootScope'];
  constructor (rootScope: ng.IRootScopeService) {
    this._rootScope = rootScope;
  }

  // FIXME: remove this class
}

_app.registrar.service(constants.actionEmitter.name, ActionEmitter);
log.debug('Registered action emitter service');
