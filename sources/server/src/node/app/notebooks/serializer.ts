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


export class MultiFormatSerializer implements app.INotebookSerializer {

  _formatToSerializer: app.Map<app.INotebookSerializer>;

  constructor (formatToSerializer: app.Map<app.INotebookSerializer>) {
    this._formatToSerializer = formatToSerializer;
  }

  /**
   * Deserialize a notebook in the specified format from a data string
   */
  parse (notebookData: string, format: string) {
    var serializer = this._getSerializerForFormatOrThrow(format);
    return serializer.parse(notebookData, format);
  }

  /**
   * Serialize the notebook to a string in the specified format
   */
  stringify (notebook: app.notebook.Notebook, format: string) {
    var serializer = this._getSerializerForFormatOrThrow(format);
    return serializer.stringify(notebook, format);
  }

  /**
   * Gets a serializer that supports the specified notebook format.
   *
   * Throws an exception if the format is unsupported
   */
  _getSerializerForFormatOrThrow (format: string) {
    var serializer = this._formatToSerializer[format];
    if (!serializer) {
      throw new Error('Unsupported notebook format for serialization: "' + format + '"');
    }
    return serializer;
  }

}
