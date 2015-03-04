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
 * Type definitions for the IPython notebook v3 format
 */
declare module app {
  module ipy {
    /* A minimal ipynb v3 format notebook

    {
      "metadata": {
      "name": "",
      "signature": "sha256:hash-value-goes-here"
     },
     "nbformat": 3,
     "nbformat_minor": 0,
     "worksheets": [
      {
       "cells": [
        {
         "cell_type": "code",
         "collapsed": false,
         "input": [
          "1 + 3"
         ],
         "language": "python",
         "metadata": {},
         "outputs": [
          {
           "metadata": {},
           "output_type": "pyout",
           "prompt_number": 1,
           "text": [
            "4"
           ]
          }
         ],
         "prompt_number": 1
        }
       ],
       "metadata": {}
      }
     ]
    };

    */

    // TODO(bryantd): this is only a subset of the possible fields at the moment
    interface Notebook {
      metadata: any;
      nbformat: number;
      nbformat_minor: number;
      worksheets: Worksheet[];
    }

    interface Worksheet {
      metadata: any;
      cells: Cell[];
    }

    interface Cell {
      cell_type: string;
      metadata?: any;
    }

    interface CodeCell extends Cell {
      input: string[];
      prompt_number?: number
      collapsed?: boolean;
      language: string;
      outputs: any[];
    }
    interface DocumentCell extends Cell {
      source: string[];
    }

    interface HeadingCell extends DocumentCell {
      source: string[];
      level: number;
    }

    interface MarkdownCell extends DocumentCell {
      // FIXME: worth keeping this interface to make the code more explicit/self-documenting?
    }

    interface CellOutput {
      output_type: string;
      text: string[];
    }
  }
}
