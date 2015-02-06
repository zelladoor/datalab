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
 */
declare module app {
  module notebook {

    /**
     * Common fields for all action messages
     */
    interface Action {
      action: string; // the name/label for the action type
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
      name: string; // 'New name for the notebook'
    }

    /* Worksheet-level actions */

    /**
     * action == 'worksheet.createCell',
     */
    interface CreateCell extends Action {
      // Fields for specifying the cell insertion point within the notebook
      worksheetId: string;
      cellId: string;
      insertAfter: string; // the cell ID after which to insert the created cell
      // Configuration for the cell to create
      type: string; // 'code' | 'md' | 'heading' | 'etc'
      source: string; // cell content string (e.g., code, markdown, etc.)
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
      sourceWorksheet: string; // worksheetId
      destinationWorksheet: string; // worksheetId
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
      source: string; // cell content string (e.g., code, markdown, etc.)
      metadata: any;
      // Flag to indicate whether the metadata dict should be merged with existing metadata
      // on the server or fully replace it (false ⇒ merge; true ⇒ replace)
      replaceMetadata: boolean;
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
