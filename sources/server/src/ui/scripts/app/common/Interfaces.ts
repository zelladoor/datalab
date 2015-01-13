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


/// <reference path="../../../../../../../externs/ts/angularjs/angular.d.ts" />


declare module app {

  interface IRegistrar {
    controller(name: string, constructor: Function): void;
    directive (name: string, directiveFactory: Function): void;
    service (name: string, constructor: Function): void;
    factory (name: string, serviceFactory: Function): void;
    constant (name: string, value: any): void;
    value (name: string, value: any): void;
    decorator (name: string, decorator: Function): void;
    filter (name: string, filterFactory: Function): void;
  }

  interface ILogger {
    debug (...objects: Object []): void;
    info (...objects: Object []): void;
    warn (...objects: Object []): void;
    error (...objects: Object []): void;
  }

  // FIXME: maybe split the ipy submodule into a separate file
  // Really, this model should be shared between front-end and backend, but need to setup
  // the build scripts such that this is possible.
  module ipy {
    // TODO: this is only a subset of the possible fields at the moment
    interface Notebook {
      metadata: any;
      nbformat: number;
      nbformat_minor: number;
      worksheets: Worksheet[];
    }

    interface Worksheet {
      metadata: any;
      cells: Cell[];
    }

    interface Cell {
      cell_type: string;
      collapsed?: boolean;
      input?: string[];
      language?: string;
      metadata?: any;
      outputs?: CellOutput[];
      prompt_number?: number;
    }

    interface CellOutput {
      metadata: any;
      output_type: string;
      prompt_number: number;
      text: string[];
    }
  }

  // FIXME: move this def to a common location for node/ui, duplicated here
  interface Map<T> {
    [index: string]: T;
  }

  // FIXME: duplicated interface from node/server-side until a shared
  // interface file is added.
  module notebook {

    interface CellOutput {
      type: string; // 'result' | 'stdout' | 'stderr'
      mimetypeBundle: any;
    }
    interface AugmentedCellOutput extends CellOutput{ // FIXME: better name for this interface?
      preferredMimetype?: string;
      trustedHtml?: string;
    }
    // FIXME: For diff types see: https://github.com/ipython/ipython/blob/master/docs/source/notebook/nbformat.rst
    // interface DisplayDataOutput extends CellOutput {
    //   // TODO: define interfaces for each output type
    // }

    interface Cell {
      id: string;
      type?: string; // "code" || "markdown" || etc

      source?: string; // the cell's "input" value
      outputs?: CellOutput[];

      executionCounter?: number;
    }

    interface Notebook {

      // FIXME: cleanup these comments
      // Just support a single worksheet initially within the implementation,
      // but make the model representation support the definition of multiple
      // worksheets to avoid needing refactoring when we want multi-worksheet UX
      //
      // Note that worksheets have been slated for removal in upcoming
      // ipython notebook format updates (see latest juptyer proposal)
      // https://github.com/ipython/ipython/wiki/Dev:-Meeting-notes,-February-6,-2013
      // https://github.com/ipython/ipython/blob/master/docs/source/notebook/nbformat.rst
      cells?: Map<Cell>;
      worksheet: string[]; // ['first-cell-id', 'second', ...]

    }
  }
}
