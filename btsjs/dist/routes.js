"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("babel-polyfill");
require("core-js/fn/object/entries");
const express_1 = require("express");
const transaction_1 = require("./transaction");
const keytool_1 = require("./keytool");
const router = express_1.Router();
// placeholder route handler
router.get('/', (req, res, next) => {
    res.render('../templates/home.html', { jigga: 'jiggga' });
});
router.post('/transaction', (req, res, next) => {
    var txIn = [], txOut = [], network = '';
    for (const [key, value] of Object.entries(req.body)) {
        console.log(`${key} ${value}`);
        for (const [k, v] of Object.entries(JSON.parse(key))) {
            console.log(`${k} ::: ${v}`);
            switch (k) {
                case 'txIn':
                    v.forEach((v) => {
                        txIn.push({ id: v.output, idx: v.idx, address: v.address, value: v.value, key: v.wif });
                    });
                    break;
                case 'txOut':
                    v.forEach((v) => {
                        txOut.push({ address: v.address, value: v.value });
                    });
                    break;
                case 'network':
                    network = v;
            }
        }
    }
    res.json({ result: transaction_1.transaction(txIn, txOut, network)
    });
});
router.post('/key/from-wif', (req, res, next) => {
    console.dir(req.body)
    let wif = null
    for (const [key, value] of Object.entries(req.body)) {
        console.log(`${key} ${value}`);
        for (const [k, v] of Object.entries(JSON.parse(key))) {
            if (k === 'wif') {
                wif = JSON.parse(key).wif;
            }
        }
    }

    if (wif) {
        const result = keytool_1.convertWifToPrivate({ wif: wif, multi: false })
        res.json({ result: keytool_1.convertWifToPrivate({ wif: wif, multi: false }) });
    }
});
exports.routes = router;
