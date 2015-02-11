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
 * Constants used to label notebook updates
 */

// Different update event/message types are bucketed under this label
export var label = 'update'

// Notebook-level update
export var notebook = {
  snapshot: 'notebook.snapshot',
  metadata: 'notebook.metadata',
  sessionStatus: 'notebook.sessionStatus'
};

// Worksheet-level update
export var worksheet = {
  addCell: 'worksheet.addCell',
  deleteCell: 'worksheet.deleteCell',
  reorderCells: 'worksheet.reorderCells'
}

// Cell-level update
export var cell = {
  update: 'cell.update'
}
