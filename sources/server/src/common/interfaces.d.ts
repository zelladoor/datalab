
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
