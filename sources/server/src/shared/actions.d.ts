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
 * Action message typedefs that define the client-server websocket protocol
 *
 * Actions are client requests for modifications to a notebook data model.
 *
 * FIXME: several actions have a corresponding update that is identical in structure
 * other than the action/update field. Coudl collapse all messages to just have a "type" field
 * rather than update/action to avoid duplicating. Other consideration is that both actions and
 * updates are emitted into the global event scope in the client-side code, possibly in the future
 * on the node side if an event emitter is ever added; have a distinction between the action and
 * update versions of a message like AddCell is important because different pieces of code will
 * handle an action (e.g., client-side code forwards these to the server) vs the update (client-
 * side code applys the AddCell operation to the local notebook model).
 */
declare module app {
  module notebook {
    module action {
      /**
       * Common fields for all action messages
       */
      interface Action {
        action: string; // the name/label for the action type
      }

      /**
       * action == 'composite'
       */
      interface Composite extends Action {
        subActions: Action[];
      }

      /* Notebook-level actions */

      /**
       * action == 'notebook.clearOutputs'
       */
      interface ClearOutputs extends Action {
        // The action label carries sufficient information for processing this action
      }
      /**
       * action == 'notebook.executeCells'
       */
      interface ExecuteCells extends Action {
        // Additional flags here eventually: e.g., flag for performing a "clean run" in sandbox
      }
      /**
       * action == 'notebook.rename'
       */
      interface Rename extends Action {
        path: string; // New path for the notebook'
      }

      /* Worksheet-level actions */

      /**
       * action == 'worksheet.addCell',
       */
      interface AddCell extends Action {
        // Fields for specifying the cell insertion point within the notebook
        worksheetId: string;
        cellId: string;

        // Configuration for the cell to add
        type: string; // 'code' | 'md' | 'heading' | 'etc'
        source: string; // cell content string (e.g., code, markdown, etc.)

        // Insert the new cell immediately after this cell ID.
        //
        // If the property is undefined, insert the cell at top/head of cells list
        insertAfter?: string;
      }
      /**
       * action == 'worksheet.deleteCell'
       */
      interface DeleteCell extends Action {
        worksheetId: string;
        cellId: string;
      }
      /**
       * action == 'worksheet.moveCell',
       */
      interface MoveCell extends Action {
        sourceWorksheetId: string;
        destinationWorksheetId: string;
        cellId: string;
        insertAfter: string; // the cell ID after which to insert the moved cell
      }

      /* Cell-level actions */

      /**
       * action == 'cell.clearOutput'
       */
      interface ClearOutput extends Action {
        worksheetId: string;
        cellId: string;
      }
      /**
       * action == 'cell.update'
       */
      interface UpdateCell extends Action {
        worksheetId: string;
        cellId: string;
        source?: string; // cell content string (e.g., code, markdown, etc.)
        prompt?: string;

        metadata?: any;
        // Flag to indicate whether the metadata dict should be merged with existing metadata
        // on the server or fully replace it (false ⇒ merge; true ⇒ replace)
        replaceMetadata?: boolean;

        outputs?: app.notebook.CellOutput[];
        // Flag determines whether the above list of outputs is appended or replaces existing
        // output list within the cell (false ⇒ append; true ⇒ replace)
        replaceOutputs?: boolean;
      }
      /**
       * action == 'cell.execute'
       */
      interface ExecuteCell extends Action {
        worksheetId: string;
        cellId: string;
      }
    }
  }
}
