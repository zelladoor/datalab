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
 * Define the public API of the notebooks module
 */

// import serializer = require('./serializer');
import notebook = require('./notebook');
import util = require('./util');
import ipy = require('./ipyserializer');

// Notebook serialization formats
export var formats = util.formats;

export var ActiveNotebook = notebook.ActiveNotebook;

// Create a serializer instance for handling all of the supported formats
var formatToSerializer = {};
formatToSerializer[notebooks.formats.ipynbV3] = ipy.IPySerializer;
// formatToSerializer[notebooks.formats.model] = notebooks.ModelSerializer;
export var serializer = new notebooks.MultiFormatSerializer(formatToSerializer);
