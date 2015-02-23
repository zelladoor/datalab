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
import notebook = require('./notebook');
import formats = require('./serializers/formats');
import ipynb = require('./serializers/ipynb');
import model = require('./serializers/model');
import multiformat = require('./serializers/multiformat');


// Create a serializer instance for handling all of the supported formats
var formatToSerializer: app.Map<app.INotebookSerializer> = {};
formatToSerializer[formats.names.ipynbV3] = new ipynb.IPySerializer();
formatToSerializer[formats.names.model] = new model.ModelSerializer();
export var serializer = new multiformat.MultiFormatSerializer(formatToSerializer);
