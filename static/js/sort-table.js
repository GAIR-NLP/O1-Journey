/**
 * sort-table.js
 * A pure JavaScript (no dependencies) solution to make HTML
 *  Tables sortable
 *
 * Copyright (c) 2013 Tyler Uebele
 * Released under the MIT license.  See included LICENSE.txt
 *  or http://opensource.org/licenses/MIT
 *
 * latest version available at https://github.com/tyleruebele/sort-table
 */

/**
 * Sort the rows in a HTML Table
 *
 * @param Table The Table DOM object
 * @param col   The zero-based column number by which to sort
 * @param dir   Optional. The sort direction; pass 1 for asc; -1 for desc
 * @returns void
 */
function sortTable(Table, col, dir) {
    var sortClass, i;

    // get previous sort column
    sortTable.sortCol = -1;
    sortClass = Table.className.match(/js-sort-\d+/);
    if (null != sortClass) {
        sortTable.sortCol = sortClass[0].replace(/js-sort-/, '');
        Table.className = Table.className.replace(new RegExp(' ?' + sortClass[0] + '\\b'), '');
    }
    // If sort column was not passed, use previous
    if ('undefined' === typeof col) {
        col = sortTable.sortCol;
    }

    if ('undefined' !== typeof dir) {
        // Accept -1 or 'desc' for descending.  All else is ascending
        sortTable.sortDir = dir == -1 || dir == 'desc' ? -1 : 1;
    } else {
        // sort direction was not passed, use opposite of previous
        sortClass = Table.className.match(/js-sort-(a|de)sc/);
        if (null != sortClass && sortTable.sortCol == col) {
            sortTable.sortDir = 'js-sort-asc' == sortClass[0] ? -1 : 1;
        } else {
            sortTable.sortDir = 1;
        }
    }
    Table.className = Table.className.replace(/ ?js-sort-(a|de)sc/g, '');

    // update sort column
    Table.className += ' js-sort-' + col;
    sortTable.sortCol = col;

    // update sort direction
    Table.className += ' js-sort-' + (sortTable.sortDir == -1 ? 'desc' : 'asc');

    // get sort type
    if (col < Table.tHead.rows[Table.tHead.rows.length - 1].cells.length) {
        sortClass = Table.tHead.rows[Table.tHead.rows.length - 1].cells[col].className.match(/js-sort-[-\w]+/);
    }
    // Improved support for colspan'd headers
    for (i = 0; i < Table.tHead.rows[Table.tHead.rows.length - 1].cells.length; i++) {
        if (col == Table.tHead.rows[Table.tHead.rows.length - 1].cells[i].getAttribute('data-js-sort-colNum')) {
            sortClass = Table.tHead.rows[Table.tHead.rows.length - 1].cells[i].className.match(/js-sort-[-\w]+/);
        }
    }
    if (null != sortClass) {
        sortTable.sortFunc = sortClass[0].replace(/js-sort-/, '');
    } else {
        sortTable.sortFunc = 'string';
    }
    // Set the headers for the active column to have the decorative class
    Table.querySelectorAll('.js-sort-active').forEach(function(Node) {
        Node.className = Node.className.replace(/ ?js-sort-active\b/, '');
    });
    Table.querySelectorAll('[data-js-sort-colNum="' + col + '"]:not(:empty)').forEach(function(Node) {
        Node.className += ' js-sort-active';
    });

    // sort!
    var rows = [],
        TBody = Table.tBodies[0];

    for (i = 0; i < TBody.rows.length; i++) {
        rows[i] = TBody.rows[i];
    }
    if ('none' != sortTable.sortFunc) {
        rows.sort(sortTable.compareRow);
    }

    while (TBody.firstChild) {
        TBody.removeChild(TBody.firstChild);
    }
    for (i = 0; i < rows.length; i++) {
        TBody.appendChild(rows[i]);
    }
}

/**
 * Compare two table rows based on current settings
 *
 * @param RowA A TR DOM object
 * @param RowB A TR DOM object
 * @returns {number} 1 if RowA is greater, -1 if RowB, 0 if equal
 */
sortTable.compareRow = function(RowA, RowB) {
    var valA, valB;
    if ('function' != typeof sortTable[sortTable.sortFunc]) {
        sortTable.sortFunc = 'string';
    }
    valA = sortTable[sortTable.sortFunc](RowA.cells[sortTable.sortCol]);
    valB = sortTable[sortTable.sortFunc](RowB.cells[sortTable.sortCol]);

    return valA == valB ? 0 : sortTable.sortDir * (valA > valB ? 1 : -1);
};

/**
 * Strip all HTML, no exceptions
 * @param html
 * @returns {string}
 */
sortTable.stripTags = function(html) {
    replace_unit = (s) => {
        let iUnit = (s.indexOf('M') > -1) ? s.indexOf('M') : s.indexOf('B');
        if (iUnit == -1) return s;
        let unit = s[iUnit];
        let val = Number(s.substring(0, iUnit));
        if (isNaN(val)) return s;
        val *= (unit == 'M') ? 1000000 : 1000000000;
        return val.toString();
    }
    html = replace_unit(html);
    return html.replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, '');
};

/**
 * Helper function that converts a table cell (TD) to a comparable value
 * Converts innerHTML to a timestamp, 0 for invalid dates
 *
 * @param Cell A TD DOM object
 * @returns {Number}
 */
sortTable.date = function(Cell) {
    // If okDate library is available, Use it for advanced Date processing
    if (typeof okDate !== 'undefined') {
        var kDate = okDate(sortTable.stripTags(Cell.innerHTML));
        return kDate ? kDate.getTime() : 0;
    } else {
        return (new Date(sortTable.stripTags(Cell.innerHTML))).getTime() || 0;
    }
};

/**
 * Helper function that converts a table cell (TD) to a comparable value
 * Converts innerHTML to a JS Number object
 *
 * @param Cell A TD DOM object
 * @returns {Number}
 */
sortTable.number = function(Cell) {
    return Number(sortTable.stripTags(Cell.innerHTML).replace(/[^-\d.]/g, ''));
};

/**
 * Helper function that converts a table cell (TD) to a comparable value
 * Converts innerHTML to a lower case string for insensitive compare
 *
 * @param Cell A TD DOM object
 * @returns {String}
 */
sortTable.string = function(Cell) {
    return sortTable.stripTags(Cell.innerHTML).toLowerCase();
};

/**
 * Helper function that converts a table cell (TD) to a comparable value
 *
 * @param Cell A TD DOM object
 * @returns {String}
 */
sortTable.raw = function(Cell) {
    return Cell.innerHTML;
};

/**
 * Helper function that converts a table cell (TD) to a comparable value
 * Captures the last space-delimited token from innerHTML
 *
 * @param Cell A TD DOM object
 * @returns {String}
 */
sortTable.last = function(Cell) {
    return sortTable.stripTags(Cell.innerHTML).split(' ').pop().toLowerCase();
};

/**
 * Helper function that converts a table cell (TD) to a comparable value
 * Captures the value of the first childNode
 *
 * @param Cell A TD DOM object
 * @returns {String}
 */
sortTable.input = function(Cell) {
    for (var i = 0; i < Cell.children.length; i++) {
        if ('object' == typeof Cell.children[i]
            && 'undefined' != typeof Cell.children[i].value
        ) {
            return Cell.children[i].value.toLowerCase();
        }
    }

    return sortTable.string(Cell);
};

/**
 * Helper function that prevents sorting by always returning null
 *
 * @param Cell A TD DOM object
 * @returns null
 */
sortTable.none = function(Cell) {
    return null;
};

/**
 * Return the click handler appropriate to the specified Table and column
 *
 * @param Table Table to sort
 * @param col   Column to sort by
 * @returns {Function} Click Handler
 */
sortTable.getClickHandler = function(Table, col) {
    return function() {
        sortTable(Table, col);
    };
};

/**
 * Attach sortTable() calls to table header cells' onclick events
 * If the table(s) do not have a THead node, one will be created around the
 *  first row
 */
sortTable.init = function() {
    var THead, Tables, Handler;
    if (document.querySelectorAll) {
        Tables = document.querySelectorAll('table.js-sort-table');
    } else {
        Tables = document.getElementsByTagName('table');
    }

    for (var i = 0; i < Tables.length; i++) {
        // Because IE<8 doesn't support querySelectorAll, skip unclassed tables
        if (!document.querySelectorAll && null === Tables[i].className.match(/\bjs-sort-table\b/)) {
            continue;
        }

        // Prevent repeat processing
        if (Tables[i].attributes['data-js-sort-table']) {
            continue;
        }

        // Ensure table has a tHead element
        if (!Tables[i].tHead) {
            THead = document.createElement('thead');
            THead.appendChild(Tables[i].rows[0]);
            Tables[i].insertBefore(THead, Tables[i].children[0]);
        } else {
            THead = Tables[i].tHead;
        }

        // Attach click events to table header
        for (var rowNum = 0; rowNum < THead.rows.length; rowNum++) {
            for (var cellNum = 0, colNum = 0; cellNum < THead.rows[rowNum].cells.length; cellNum++) {
                // Skip headers marked "js-sort-none"
                if (THead.rows[rowNum].cells[cellNum].className.match(/\bjs-sort-none\b/)) {
                    continue;
                }
                // Define which column the header should invoke sorting for
                THead.rows[rowNum].cells[cellNum].setAttribute('data-js-sort-colNum', colNum);
                Handler = sortTable.getClickHandler(Tables[i], colNum);
                window.addEventListener
                    ? THead.rows[rowNum].cells[cellNum].addEventListener('click', Handler)
                    : window.attachEvent && THead.rows[rowNum].cells[cellNum].attachEvent('onclick', Handler);
                colNum += THead.rows[rowNum].cells[cellNum].colSpan;
            }
        }

        // Mark table as processed
        Tables[i].setAttribute('data-js-sort-table', 'true')
    }

    // Add default styles as the first style in head so they can be easily overwritten by user styles
    var element = document.createElement('style');
    document.head.insertBefore(element, document.head.childNodes[0]);
    var sheet = element.sheet;
    sheet.insertRule('table.js-sort-table.js-sort-asc thead tr > .js-sort-active:not(.js-sort-none):after {content: "\\25b2";font-size: 0.7em;padding-left: 3px;line-height: 0.7em;}', 0);
    sheet.insertRule('table.js-sort-table.js-sort-desc thead tr > .js-sort-active:not(.js-sort-none):after {content: "\\25bc";font-size: 0.7em;padding-left: 3px;line-height: 0.7em;}', 0);
};

// Run sortTable.init() when the page loads
window.addEventListener
    ? window.addEventListener('load', sortTable.init, false)
    : window.attachEvent && window.attachEvent('onload', sortTable.init)
    ;

// Shim for IE11's lack of NodeList.prototype.forEach
if (typeof NodeList.prototype.forEach !== "function") {
    NodeList.prototype.forEach = Array.prototype.forEach;
}
