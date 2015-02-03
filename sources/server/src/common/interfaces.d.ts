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


// Explicitly permit o['property'] references on all objects by defining
// an explicit indexer on Object. For details,
// see: https://typescript.codeplex.com/discussions/535628
interface Object {
  [index: string]: any;
}

declare module app {

  interface Map<T> {
    [index: string]: T;
  }

  module notebook {

    interface CellOutput {
      type: string; // 'result' | 'error' | 'stdout' | 'stderr'
      mimetypeBundle: any;
    }

    interface Cell {
      id: string;
      type?: string; // 'code' | 'markdown' | 'heading' | 'etc'

      source?: string; // the cell's "input" value
      outputs?: CellOutput[];

      executionCounter?: string;

      metadata?: any;
    }

    interface Notebook {
      cells?: Map<Cell>;
      // FIXME: cleanup these comments
      // Just support a single worksheet initially within the implementation,
      // but make the model representation support the definition of multiple
      // worksheets to avoid needing refactoring when we want multi-worksheet UX
      //
      // Note that worksheets have been slated for removal in upcoming
      // ipython notebook format updates (see latest juptyer proposal)
      // https://github.com/ipython/ipython/wiki/Dev:-Meeting-notes,-February-6,-2013
      // https://github.com/ipython/ipython/blob/master/docs/source/notebook/nbformat.rst
      worksheet: string[]; // [cell ids]
    }
  }
}
