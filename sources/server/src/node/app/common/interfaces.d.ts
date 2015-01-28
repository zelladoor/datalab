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
 * Interfaces definitions
 */
declare module app {

  interface Settings {
    httpPort: number;
  }

  interface Map<T> {
    [index: string]: T;
  }

  interface EventHandler<T> {
    (event: T): void;
  }

  interface KernelConfig {
    iopubPort: number;
    shellPort: number;
  }

  interface IKernel {
    id: string;
    config: KernelConfig;
    execute (request: ExecuteRequest): void;
    onExecuteReply (callback: EventHandler<ExecuteReply>): void;
    onKernelStatus (callback: EventHandler<KernelStatus>): void;
    onOutputData (callback: EventHandler<OutputData>): void;
    shutdown (): void;
    start (): void;
  }

  interface IKernelManager {
    create (config: KernelConfig): IKernel;
    get (id: string): IKernel;
    list (): IKernel[];
    shutdown (id: string): void;
    shutdownAll (): void;
  }

  interface INotebookSerializer {
    toString (notebook: notebook.Notebook): string;
    fromString (data: string): notebook.Notebook;
  }

  interface ISession {
    id: string;
    getKernelId (): string;
    getUserConnectionIds (): string[];
    updateUserConnection (connection: IUserConnection): void;
  }

  interface IStorage {
    read (path: string): string;
    write (path: string, data: string): void;
    delete (path: string): boolean;
    // move (sourcePath: string, destinationPath: string);
    // copy (sourcePath: string, destinationPath: string);
  }


  interface IUserConnection {
    id: string;
    getNotebookPath (): string;
    onDisconnect (callback: EventHandler<IUserConnection>): void;
    onExecuteRequest (callback: EventHandler<ExecuteRequest>): void;
    sendExecuteReply (reply: ExecuteReply): void;
    sendExecuteResult (result: ExecuteResult): void;
    sendSessionStatus (status: SessionStatus): void;
    sendNotebookUpdate (notebookUpdate: NotebookUpdate): void;
  }

  interface IUserConnectionManager {
    onConnect (callback: EventHandler<IUserConnection>): void;
    onDisconnect (callback: EventHandler<IUserConnection>): void;
  }

  // FIXME: duplicate content of other interface file
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
    }
    interface Notebook {
      cells?: Map<Cell>;
      worksheet: string[]; // [cell ids]
    }

    interface IActiveNotebook { // FIXME: better name for this?
      getData (): Notebook;
      // TODO(bryantd): methods below will actually return a "Notebok changes"/delta eventually
      // Returning a full notebook for the time being until notebook deltas are implemented
      putCell (cell: Cell): Notebook;
      updateCell (cell: Cell): Notebook;
    }
  }

}

