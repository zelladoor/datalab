// Basic table viewer helper for BigQuery tables.

define(['d3', 'crossfilter', 'dc'], function(d3, crossfilter, dc) {
    return {
        makeTableViewer: function(tableName, tableView, labels, totalRows, rowsPerPage, jobId) {
            if (tableView == undefined) {
                console.log("NO DIV!");
                return;
            }

            var model = {
                "firstRow": 0,
                "displayPage": 1,
                'data': []
            }

            var viewerDiv = document.createElement('div');
            var cnum = 0;
            var widget = d3.select(viewerDiv);

            // Make a div for the optional chart. This needs an id (used by dc.js, not us).
            var chart = widget
                .append('div')
                .attr('class', 'bqtv-chart-div')
                .attr('id', 'bqtv-chart' + cnum++);
            widget.append('br');

            var metaDataDiv = widget.append('div');
            if (totalRows >= 0) {
                metaDataDiv.append('div')
                    .attr('class', 'bqtv-meta-left')
                    .text(totalRows + ' rows');
            }
            metaDataDiv.append('div').attr('class', 'bqtv-meta-right')
                .text(jobId.length ? ('Job: ' + jobId) : tableName);

            widget.append('br');

            var naviDiv = widget.append('div');

            var naviLeft = naviDiv.append('div').attr('class', 'bqtv-meta-left');
            naviLeft.append('span').attr('class', 'bqtv-meta-text').text('Page ');
            var pageInput = naviLeft.append('input')
                .attr('type', 'number')
                .attr('min', '1')
                .attr('value', '1')
                .attr('class', 'bqtv-page-input')
                .on('input', function () {
                    if (this.value >= 1 && (totalRows < 0 || this.value <= totalRows)) {
                        model.displayPage = this.value;
                        requestPageUpdate();
                    }
                });
            if (totalRows >= 0) {
                naviLeft.append('span').attr('class', 'bqtv-meta-text').text(' of ');
                var totalPagesSpan = naviLeft.append('span').attr('class', 'bqtv-meta-text');
            }


            var table = widget
                .append('div').attr('class', 'bqtv-table-div')
                .append('table').attr('class', 'bqtv-table');

            var tableLabelRow = table
                .append('thead').attr('class', 'dc-table-head')
                .append('tr');

            // ToT version of dc can add column headers but stable version doesn't, so for
            // now we have to do these ourselves.

            labels = ['Row'].concat(labels)
            for (var i = 0; i < labels.length; i++) {
                tableLabelRow.append('td').text(labels[i]);
            }

            tableView.appendChild(viewerDiv);

            function rowFunc(r) {
                return r.Row
            };

            // TODO(gram): ToT of DC allows us to pass in an array of strings
            // to the columns function, but the stable version right now doesn't
            // support that; it wants an array of functions, so create those.
            var columns = []
            for (var i = 0; i < labels.length; i++) {
                columns.push(function(label) {
                    return function(r) {
                        return r[label];
                    };
                }(labels[i]));
            }

            var datatable = null;
            var xdata = null;
            var rowDimension = null;

            function addRows(data) {
                // Add row index to data
                for (var i = 0; i < data.length; i++) {
                    data[i].Row = model.firstRow + i + 1;
                }
            }

            // Update dynamic content.
            function update(data, metadata) {
                var numRows = rowsPerPage;
                var startRow = (model.displayPage - 1) * rowsPerPage;
                var numPages = -1;
                if (totalRows >= 0) {
                    numPages = model.num_pages = Math.ceil(totalRows / numRows);
                    var rowsLeft = totalRows - startRow;
                    if (numRows > rowsLeft) {
                        numRows = rowsLeft;
                    }
                }

                if (model.data != data) {
                    if (xdata == null) {
                        // First time
                        xdata = crossfilter(data);
                        rowDimension = xdata.dimension(rowFunc)
                        setupChart(xdata, metadata, chart.node());
                    } else {
                        // Replace the data in the crossfilter.
                        rowDimension.filter(null);
                        xdata.remove();
                        xdata.add(data);
                    }
                    model.data = data;
                }

                // Filter to the current page in view
                rowDimension.filterRange([startRow + 1, startRow + numRows + 1]);

                if (datatable == null) {
                    // Add the table.
                    datatable = dc.dataTable(table.node())
                        .dimension(xdata.dimension(rowFunc))
                        .size(rowsPerPage)
                        .group(function () {})  // Mandatory even though we don't want groups.
                        .columns(columns)
                        .sortBy(rowFunc);
                }
                datatable.render();

                if (numPages >= 0) {
                    pageInput.attr('max', numPages).attr('value', model.displayPage.toString());
                    totalPagesSpan.text(numPages);
                }
            }

            function requestPageUpdate() {
                // See if we need to fetch more data
                var first = (model.displayPage - 1) * rowsPerPage;
                var last = first + rowsPerPage;
                if (first >= model.firstRow && last < (model.firstRow + model.data.length)) {
                    update(model.data);
                } else {
                    // Fetch more data. We try to fetch data surrounding the display page so the
                    // user can go forward or back through locally cached data. However, if the
                    // total amount of data is less than 1500 rows, ignore that and fetch it all
                    // (this would be a first load).
                    var count = 1000;
                    if (totalRows >= 0 && totalRows <= 1500) { // Less than 1500; fetch all.
                        count = totalRows;
                    }

                    // Fetch rows surrounding <first> so we can move back/forward fast.
                    model.firstRow = first - (count / 2) - rowsPerPage;

                    if (totalRows >= 0 && model.firstRow > totalRows - count) {
                        // We would fetch less than <count> so back up more.
                        model.firstRow = totalRows - count;
                    }

                    if (model.firstRow < 0) {
                        model.firstRow = 0;
                    }
                    var code = '%_get_table_rows ' + tableName + ' ' + model.firstRow +
                        ' ' + count;
                    IPython.notebook.kernel.get_data(code, function (data, error) {
                        if (error) {
                            tableView.innerHTML = 'Unable to render the table. ' +
                            'The data being displayed could not be retrieved: ' + error;
                        } else {
                            // TODO(gram): what if the data already has a column named Row?
                            addRows(data['data']);
                            update(data['data'], data['metadata']);
                        }
                    });
                }
            }

            function makeLineChart(div, width, height, xfilter, dimProp, plotProps, colors, yLabel) {
                if (typeof dimProp == 'string') {
                    var dimFunc = function (r) {
                        return r[dimProp];
                    };
                } else {
                    var dimFunc = function (r) {
                        var year = r[dimProp[0]];
                        var month = r[dimProp[1]];
                        var day = r[dimProp[2]];
                        return new Date(year, month, day);
                    }
                }

                var dimension = xfilter.dimension(dimFunc);
                var minX = dimFunc(dimension.bottom(1)[0]);
                var maxX = dimFunc(dimension.top(1)[0]);

                var groups = [];
                for (var i = 0; i < plotProps.length; i++) {
                    groups[i] = function(d, p) {
                        return d.group().reduceSum(function(d) {
                            return d[p];
                        });
                    }(dimension, plotProps[i]);
                }

                var lc;
                if (plotProps.length > 1) {
                    lc = dc.compositeChart(div);
                    var subcharts = [];
                    for (var i = 0; i < plotProps.length; i++) {
                        subcharts[i] = dc.lineChart(lc)
                            .dimension(dimension)
                            .colors([colors[i]])
                            .group(groups[i], plotProps[i]);
                    }
                    lc.dimension(dimension); // Just so caller can get at this.
                    lc.compose(subcharts)
                        .brushOn(false);

                } else {
                    lc = dc.lineChart(div);
                    lc.dimension(dimension)
                        .colors(colors)
                        .group(groups[0], plotProps[0])
                        .brushOn(true);
                }

                lc.width(width).height(height)
                    .legend(dc.legend().x(50).y(10).itemHeight(13).gap(5));

                if (minX instanceof Date) {
                    lc.x(d3.time.scale().domain([minX, maxX]))
                } else {
                    lc.x(d3.scale.linear().domain([minX, maxX]))
                }
                if (yLabel) {
                    lc.yAxisLabel(yLabel);
                }

                return lc;
            }

            function setupChart(xfilter, metadata, div) {
                // 1. If we have no meta-data this is paginated data and we just return.

                if (metadata.length == 0) return;

                // 2. Look at the fields that are valid (no None values) and interesting (not
                //    single-valued) to pick a suitable dimension. If we have a single timestamp
                //    field that takes precedence and we do a line chart. Else if we have a single
                //    string field that takes precedence and we do a bar chart. If we have neither
                //    a string nor a timestamp field we use the row index as a dimension and use
                //    a line chart. Anything else we just return.
                //
                //    Note that if we have non-unique entries for a timestamp we need to be
                //    careful. They will get summed which may not make any sense, especially if
                //    they are broken out categorically.

                var dimField = '';
                var dateFields = [];
                var fields = Object.keys(metadata);
                for (var i = 0; i < fields.length; i++) {
                    var field = fields[i];
                    if (metadata[field].type == 'TIMESTAMP') {
                        console.log('Found timestamp field ' + field);
                        if (dimField == '') {
                            dimField = field;
                        } else {
                            dimField = null;
                        }
                    } else {
                        var idx = ['year', 'month', 'day'].indexOf(field.toLowerCase());
                        if (idx >= 0) {
                            dateFields[idx] = field;
                        }
                    }
                }

                if (dimField == null) {
                    // We found more than one timestamp field.
                    console.log('Found multiple timestamp fields; cannot chart');
                    return;
                }

                if (dimField == '') {
                    if (dateFields.length >= 0) {
                        dimField = dateFields;
                        for (var i = 0; i < dateFields.length; i++) {
                            if (dateFields[i] == undefined) {
                                dimField = 'Row';
                                break;
                            } else if (!metadata[dateFields[i]].valid) {
                                console.log('Found timestamp component field ' + dateFields[i] + ' but it has invalid values; cannot chart');
                                return;
                            }
                        }
                    } else {
                        // Use Row for now.
                        dimField = 'Row';
                    }
                    if (dimField == 'Row') {
                        console.log('Found no timestamp field; falling back to Row dimension');
                    } else {
                        console.log('Using composite timestamp: ' + dateFields.join('/'));
                    }
                } else if (!metadata[dimField].valid) {
                    console.log('Found timestamp field ' + dimField + ' but it has invalid values; cannot chart');
                    return;
                }

                //dimField = 'Row';

                // 3. Pick the group fields. We find the first numeric field that is not
                //    the dimension and is not single-valued. We then add any other such fields
                //    that have similar ranges.
                //
                // TODO: Should we drop integer fields with small ranges? They are likely either
                // categorical or not very interesting.

                var groups = []
                var allowedMin, allowedMax;
                var colors = ['red', 'blue', 'green', 'yellow', 'black'];
                //var colors = ['red'];
                for (var i = 0; i < fields.length; i++) {
                    var field = fields[i];
                    var field_metadata = metadata[field];
                    if (field == 'Row' || field == dimField || dateFields.indexOf(field) >= 0) {
                        continue;
                    }
                    if (field_metadata.type == 'STRING' || field_metadata.type == 'BOOLEAN') {
                        continue;
                    }
                    var max = field_metadata.max;
                    var min = field_metadata.min;
                    if (max == min) {
                        continue;  // Uninteresting.
                    }
                    if (groups.length == 0) {
                        groups.push(field);
                        var range = max - min;
                        allowedMin = min - range;
                        allowedMax = max + range;
                    } else {
                        if (min > allowedMin && max < allowedMax) {
                            groups.push(field);
                        }
                    }
                    if (groups.length >= colors.length) {
                        break;
                    }
                }

                console.log('Charting, dimension ' + dimField);
                for (var i = 0; i < groups.length; i++) {
                    console.log('Group ' + groups[i]);
                }
                makeLineChart(div, div.offsetWidth, div.offsetWidth / 3, xfilter, dimField, groups,
                    colors).render();
            }

            // Notify the Python object so we get the first page.
            requestPageUpdate();
        }
    };
});

