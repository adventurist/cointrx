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
    var txIn = [], txOut = [], txAmount;
    for (const [key, value] of Object.entries(req.body)) {
        console.log(`${key} ${value}`);
        for (const [k, v] of Object.entries(JSON.parse(key))) {
            console.log(`${k} ::: ${v}`);
            switch (k) {
                case 'txIn':
                    v.forEach((v) => {
                        txIn.push({ id: v.output, key: v.address, value: v.value });
                    });
                    break;
                case 'txOut':
                    v.forEach((v) => {
                        txOut.push({ key: v.address, value: v.value });
                    });
                    break;
            }
        }
    }
    let number = transaction_1.jiggaloo();
    res.json({
        message: 'Hello Jigga number ' + number
    });
});
exports.routes = router;
