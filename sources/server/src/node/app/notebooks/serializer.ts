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
 * Simplest possible serializaton/deserialization of an in-memory notebook to/from a string
 *
 * TODO(bryantd): If we end up wanting to keep an (effectively) no-op ser/de implementation
 * in addition to proper .nb and .ipynb versions, then we need a better name for this module.
 *
 * Note: would be simpler to have this module just export the static functions as top-level
 * entities, but module interface typedefs are not well-baked yet. Re-evaluate down the road
 * and for context see: http://stackoverflow.com/questions/16072471
 * Given the akwardness of module interface typedefs at the moment, fully static classes seem
 * simpler/cleaner at the moment.
 *
 */
export class NotebookSerializer implements app.INotebookSerializer {

  /**
   * Serialize the in-memory notebook model as-is to a JSON string
   */
  toString (notebook: app.notebook.Notebook) {
    return JSON.stringify(notebook, null, 2);
  }

  /**
   * Deserialize an in-memory notebook model from a JSON string
   */
  fromString (notebookData: string) {
    return JSON.parse(notebookData);
  }

}
