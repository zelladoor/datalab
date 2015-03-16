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
 * Directive for creating a single code editor element
 *
 * This directive wraps a CodeMirror instance and exposes attributes for two-way binding source
 * (text) content.
 *
 * FIXME: switch to .min version of codemirror deps
 */
/// <reference path="../../../../../../../../externs/ts/angularjs/angular.d.ts" />
/// <amd-dependency path="codeMirror/mode/python/python" />
/// <amd-dependency path="codeMirror/addon/edit/matchbrackets" />
import logging = require('app/common/Logging');
import constants = require('app/common/Constants');
import app = require('app/App');
import codeMirror = require('codeMirror'); // FIXME: where is this str constant value defined???

var log = logging.getLogger(constants.scopes.codeEditor);

// TODO: enable dynamic language selection based upon directive attributes
var codeMirrorOptions: CodeMirror.EditorConfiguration = {
  lineNumbers: false,
  indentUnit: 4,

  // Language mode requires additional assets be requested via amd-dependency
  mode: {
    name: "python",
  },

  // Themes require additional css imports
  // TODO(bryantd): load these async, currently static-defined in index.html
  // theme: "mdn-like",
  theme: 'googley',

  // Options below require addons to be loaded via amd-dep as well
  matchBrackets: true,
};

/**
 * Defines the shape of the directive scope.
 */
interface CodeEditorScope extends ng.IScope {
  source?: string;
  active?: boolean;
  getKeymap?: Function;
  getActionHandlers?: Function; // FIXME: prob rename, type
}

class CodeEditorController {
  static $inject = ['$scope'];
  constructor (scope: any) {
    // FIXME: get rid of this controller if there's no logic needed here
  }
}

/**
 * Sets up the event handlers to link the directive scope to the external world.
 *
 * @param scope the directive's (isolate) scope
 * @param element the jqLite-selected directive element
 */
function codeEditorDirectiveLink (
    scope: CodeEditorScope,
    element: ng.IAugmentedJQuery,
    attrs: any)
    : void {
  var cmContainer = <HTMLTextAreaElement>element[0];

  var cmInstance: CodeMirror.Editor = codeMirror(cmContainer, codeMirrorOptions);
  cmInstance.addKeyMap(scope.getKeymap());

  // Sets the inital code editor content equal to the linked template attribute value.
  // The 'code' element attribute will point to a value in the parent scope/controller.
  cmInstance.setValue(scope.source);

  // Watch the scope for new source content values and publish them into the CodeMirror instance
  scope.$watch('source', (newValue: any, oldValue: any) => {
    // Guard agains cyclical updates when editing cells
    // i.e., cm.changed -> scope.changed -> cm.changed loops due to watching the scope
    if (cmInstance.getValue() != newValue) {
      // Overwrite the previous editor contents with the updated version
      //
      // Note: this will kill any "dirty" changes that haven't been persisted,
      // but this is only a concern in multi-writer environments (unsupported currently) where multiple
      // users are editting the same cell's content. One approach to avoid needing within-cell content
      // resolution under multiple writers is to effectively lock a cell for a given user whenever said
      // user focuses the cell, disallowing any competing edits from other users. Will need UX treatment
      // to illustrate who owns a given cell (e.g., a cell level user "cursor", maybe based upon the cell
      // border color or something).
      cmInstance.setValue(newValue);
    }
  });

  // Registers a callback to update the scope's 'code' value when the CodeMirror content changes
  cmInstance.on('change', (
      cm: CodeMirror.Editor,
      change: CodeMirror.EditorChange
      ) => {

    if (cm.getValue() == scope.source) {
      // No need to publish an updated value to the scope (already in-sync)
      return;
    }

    // Wraps scope modifications in an $apply to "publish" them to the parent scope/ctrl
    scope.$apply(() => {
      scope.source = cm.getValue();
    });
  });

  var actions: any = scope.getActionHandlers();
  if (actions.focus) {
    cmInstance.on('focus', (cm: CodeMirror.Editor) => {
      actions.focus(cm);
      scope.active = true;
    });
  }
  if (actions.blur) {
    // FIXMEACTIVE: may need to disable this because really want to maintain
    // the cell active as long as the user hasn't clicked outside of the entire
    // cell region, not just the code mirror region. Current issue is that clicking
    // the cell toolbar deactivates the cell, which immediately hides the toolbar,
    // which prevents the toolbar button from getting the event (and has the weird ux
    // of hiding the toolbar/removing focus from the cell).
    cmInstance.on('blur', (cm: CodeMirror.Editor) => {
      actions.blur(cm);
      scope.active = false;
    });
  }

  // If the cell active property becomes true, give focus to the codemirror textarea
  scope.$watch('active', (isActive: boolean) => {
    if (isActive) {
      cmInstance.focus();
    }
  });
};

/**
 * Creates a code editor directive
 *
 * @return a directive definition
 */
function codeEditorDirective (): ng.IDirective {
  return {
    restrict: 'E',
    scope: {
      source: '=',
      active: '=',
      getKeymap: '&keymap',
      getActionHandlers: '&actions'
    },
    link: codeEditorDirectiveLink,
    controller: CodeEditorController
  }
}

app.registrar.directive(constants.codeEditor.directiveName, codeEditorDirective);
log.debug('Registered code editor directive');
