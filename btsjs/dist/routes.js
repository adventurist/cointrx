"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("babel-polyfill");
require("core-js/fn/object/entries");
const express_1 = require("express");
const transaction_1 = require("./transaction");
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
                        txIn.push({ id: v.output, address: v.address, value: v.value, key: v.wif });
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
    let txId = 69;
    const transactionResult = transaction_1.transaction(txIn, txOut, network);
    res.json({
        message: 'Hello Jigga'
    });
});
exports.routes = router;
