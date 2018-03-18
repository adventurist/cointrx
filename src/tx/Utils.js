import React from "react";
import namor from "namor";
import "./index.css";

import { tsvParse, csvParse } from  "d3-dsv";
import { timeParse } from "d3-time-format";

import jsonParse from './jsonParse'

function parseData(parse) {
    return function(d) {
        d.date = parse(d.date);
        d.open = +d.open;
        d.high = +d.high;
        d.low = +d.low;
        d.close = +d.close;
        d.volume = +d.volume;

        return d;
    };
}

function parseJsonData(parse) {
    console.dir(parse)
    return function(d) {
        console.dir(d)
        d.date = parse(d.date)
        d.open = d.low
        d.low = d.low
        d.high = d.high
        d.close = d.close;
        d.volume = ''

        return d
    }
}

const parseDate = timeParse("%Y-%m-%d");
const jsonParser = jsonParse("\t")

// export function getData() {
//     const promiseMSFT = fetch("//rrag.github.io/react-stockcharts/data/MSFT.tsv")
//         .then(response => response.text())
//         .then(data => tsvParse(data, parseData(parseDate)))
//     return promiseMSFT;
// }

export function getJson() {
    const promiseJSON = fetch('/api/prices/regtest/btc/cad/minmax/json')
        .then(response => response.text())
        .then(data => jsonParser.parse(JSON.parse(data)))
    return promiseJSON
}


const range = len => {
    const arr = [];
    for (let i = 0; i < len; i++) {
        arr.push(i);
    }
    return arr;
};

const newPerson = () => {
    const statusChance = Math.random();
    return {
        firstName: namor.generate({ words: 1, numbers: 0 }),
        lastName: namor.generate({ words: 1, numbers: 0 }),
        age: Math.floor(Math.random() * 30),
        visits: Math.floor(Math.random() * 100),
        progress: Math.floor(Math.random() * 100),
        status:
            statusChance > 0.66
                ? "relationship"
                : statusChance > 0.33 ? "complicated" : "single"
    };
};

export function makeData(len = 5553) {
    return range(len).map(d => {
        return {
            ...newPerson(),
            children: range(10).map(newPerson)
        };
    });
}

export const Logo = () =>
    <div style={{ margin: '1rem auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center'}}>
        For more examples, visit {''}
        <br />
        <a href="https://github.com/react-tools/react-table" target="_blank">
            <img
                src="https://github.com/react-tools/media/raw/master/logo-react-table.png"
                style={{ width: `150px`, margin: ".5em auto .3em" }}
            />
        </a>
    </div>;

export const Tips = () =>
    <div style={{ textAlign: "center" }}>
        <em>Tip: Hold shift when sorting to multi-sort!</em>
    </div>;
