var EOL = {},
    EOF = {},
    QUOTE = 34,
    NEWLINE = 10,
    RETURN = 13;

function objectConverter(columns) {
    return new Function("d", "return {" + columns.map(function(name, i) {
            return JSON.stringify(name) + ": d[" + i + "]";
        }).join(",") + "}");
}

function customConverter(columns, f) {
    var object = objectConverter(columns);
    return function(row, i) {
        return f(object(row), i, columns);
    };
}

// Compute unique columns in order of discovery.
function inferColumns(rows) {
    var columnSet = Object.create(null),
        columns = [];

    rows.forEach(function(row) {
        for (var column in row) {
            if (!(column in columnSet)) {
                columns.push(columnSet[column] = column);
            }
        }
    });

    return columns;
}

export default function(delimiter) {
    var reFormat = new RegExp("[\"" + delimiter + "\n\r]"),
        DELIMITER = delimiter.charCodeAt(0);

    function parse(text, f) {
        // var convert, columns, rows = parseRows(text, function(row, i) {
        //     if (convert) return convert(row, i - 1);
        //     columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
        // });
        const rows = text
        const newRows = rows.map(row => {
            const avg = (parseFloat(row.low) + parseFloat(row.high)) / 2
            const subTracted = Math.abs((mockRandom() * avg) - avg)
            const added = (mockRandom() * avg) + avg

            return {
                low: row.low,
                high: row.high,
                open:  flipCoin() ? <added></added> : subTracted,
                close: flipCoin() ? added : subTracted,
                date: new Date(row.date)}
            })
        newRows.columns = [];
        return newRows;
    }

    function format(rows, columns) {
        if (columns == null) columns = inferColumns(rows);
        return [columns.map(formatValue).join(delimiter)].concat(rows.map(function(row) {
            return columns.map(function(column) {
                return formatValue(row[column]);
            }).join(delimiter);
        })).join("\n");
    }

    function formatRows(rows) {
        return rows.map(formatRow).join("\n");
    }

    function formatRow(row) {
        return row.map(formatValue).join(delimiter);
    }

    function formatValue(text) {
        return text == null ? ""
            : reFormat.test(text += "") ? "\"" + text.replace(/"/g, "\"\"") + "\""
                : text;
    }

    return {
        parse: parse,
        parseRows: () => true,
        format: format,
        formatRows: formatRows
    };
}

function mockRandom() {
    const max = 0.02, min = 0.001
    return Math.random() * (max - min) + min
}

function flipCoin() {
    return Math.random() >= 0.5
}
