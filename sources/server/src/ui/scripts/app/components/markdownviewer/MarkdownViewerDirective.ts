
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
 * Renders Markdown content to HTML
 */
/// <reference path="../../../../../../../../externs/ts/angularjs/angular.d.ts" />
/// <reference path="../../../../../../../../externs/ts/marked.d.ts" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import app = require('app/App');
import marked = require('marked');


var log = logging.getLogger(constants.scopes.markdownViewer);

interface MarkdownViewerScope extends ng.IScope { // FIXME: naming convention for local scopes
  source: string;
  trustedHtml?: any;
}

class MarkdownViewerController {
  _sce: ng.ISCEService;
  _scope: MarkdownViewerScope;

  static $inject: string[] = ['$scope', '$sce'];
  constructor (scope: MarkdownViewerScope, sce: ng.ISCEService) {
    this._sce = sce;
    this._scope = scope;
  }

  renderMarkdownAsTrustedHtml (markdown: string) {
    return this._sce.trustAsHtml(marked(markdown))
  }
}

function markdownViewerDirectiveLink (
    scope: MarkdownViewerScope,
    element: ng.IAugmentedJQuery,
    attrs: any,
    ctrl: MarkdownViewerController) {

  // Re-render the markdown sourced to html whenever the source value changes
  scope.$watch('source', (newValue: any, oldValue: any) => {
    scope.trustedHtml = ctrl.renderMarkdownAsTrustedHtml(newValue);
  });

}

/**
 * Creates a directive definition.
 */
function markdownViewerDirective (): ng.IDirective {
  return {
    restrict: 'E',
    scope: {
      source: '=' // FIXME: possible to make this a one-way (read-only) binding?
    },
    templateUrl: constants.scriptPaths.app + '/components/markdownviewer/markdownviewer.html',
    replace: true,
    link: markdownViewerDirectiveLink,
    controller: MarkdownViewerController
  }
}

app.registrar.directive(constants.markdownViewer.directiveName, markdownViewerDirective);
log.debug('Registered markdown viewer directive');
