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
        console.log(value[key]);
        const time = new Date();
        console.log(time.getTime() + ': TX Request');
        for (const [k, v] of Object.entries(JSON.parse(key))) {
            console.log(k + ':::' + v);
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
    console.log(req.body);
    const body = JSON.parse(Object.keys(req.body)[0]);
    const wif = body.wif;
    if (wif) {
        res.json({ result: keytool_1.convertWifToPrivate({ wif: wif, multi: false }) });
    }
});
exports.routes = router;
