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
 * Update message typedefs that define the client-server websocket protocol
 *
 * Updates are server messages that propagate notebook model changes to clients participating
 * in a given notebook editing session.
 */
declare module app {
  module notebook {
    module update {
      /**
       * Common fields for all update messages
       */
      interface Update {
        update: string; // A name/label for the type of update message
      }

      /**
       * update == 'composite'
       */
      interface Composite extends Update {
        subUpdates: Update[];
      }

      /**
       * A snapshot of the notebook data
       *
       * Note that the server may send the full data for only a subset of all worksheets.
       *
       * update == 'notebook.snapshot'
       */
      interface Snapshot extends Update {
        notebook: Notebook;
      }

      /* Notebook-level updates */

      /**
       * update == 'notebook.metadata'
       */
      interface NotebookMetadata extends Update {
        path: string; // notebook path
      }
      /**
       * update == 'notebook.sessionStatus'
       */
      interface SessionStatus extends Update {
        kernelState: string; // 'starting' | 'idle' | 'busy'
        kernelName: string; // a string that uniquely identifies a kernel flavor; e.g., 'Python 2.7'
      }

      /* Worksheet-level updates */

      /**
       * update == 'worksheet.addCell'
       */
      interface AddCell extends Update {
        worksheetId: string;
        cell: Cell;
      }
      /**
       * update == 'worksheet.deleteCell'
       */
      interface DeleteCell extends Update {
        worksheetId: string;
        cellId: string;
      }
      /**
       * update == 'worksheet.moveCell'
       */
      interface MoveCell extends Update {
        sourceWorksheetId: string;
        destinationWorksheetId: string;
        cellId: string;
        insertAfter: string; // the cell ID after which to insert the moved cell
      }

      /* Cell-level updates */

      /**
       * A cell-level update
       *
       * update == 'cell.update'
       */
      interface CellUpdate extends Update {
        worksheetId: string;
        cellId: string;

        source?: string; // new source string value

        outputs?: CellOutput[];
        // Flag determines whether the above list of outputs is appended or replaces existing
        // output list within the cell (false ⇒ append; true ⇒ replace)
        replaceOutputs?: boolean;

        metadata?: {};
        // Flag to indicate whether the metadata dict should be merged with existing metadata
        // on the client or fully replace it (false ⇒ merge; true ⇒ replace)
        replaceMetadata?: boolean;
      }
    }
  }
}
