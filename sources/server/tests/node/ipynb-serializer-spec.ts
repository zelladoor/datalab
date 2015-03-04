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



describe('IPython .ipynb v3 format serialization', () => {
  var ipynb: app.ipy.Notebook;
  var notebook: app.notebook.Notebook;

  beforeEach(() => {
    ipynb = null;
    notebook = null;
  });

  afterEach(() => {
    ipynb = undefined;
    notebook = undefined;
  });

  it('shou', () => {
    // var notebookData: app.notebook.Notebook = notebook.getSnapshot()
    // expect(notebookData.worksheetIds.length).toBe(1);
  });

});
