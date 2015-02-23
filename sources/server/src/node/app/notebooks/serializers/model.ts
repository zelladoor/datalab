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


import formats = require('./formats');


/**
 * Simplest possible serializaton/deserialization of an in-memory notebook model to/from a string
 */
export class ModelSerializer implements app.INotebookSerializer {

  /**
   * Deserialize an in-memory notebook model from a JSON string
   */
  parse (notebookData: string, format: string) {
    this._validateFormatOrThrow(format);
    return JSON.parse(notebookData);
  }

  /**
   * Serialize the in-memory notebook model as-is to a JSON string
   */
  stringify (notebook: app.notebook.Notebook, format: string) {
    this._validateFormatOrThrow(format);
    return JSON.stringify(notebook, null, 2);
  }

  /**
   * Validate that this serializer can parse the notebook specified format.
   *
   * Throws an exception if the format is unsupported by this serializer.
   */
  _validateFormatOrThrow (format: string) {
    if (format != formats.names.model) {
      throw new Error('Unsupported notebook format for serialization: "' + format + '"');
    }
  }

}
