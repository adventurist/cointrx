"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_1 = require("./transaction");
const router = express_1.Router();
// placeholder route handler
router.get('/', (req, res, next) => {
    res.render('../templates/home.html', { jigga: 'jiggga' });
});
router.post('/transaction', (req, res, next) => {
    // let args = JSON.parse(req.body);
    // Object.keys(req.body).forEach(key => {
    //     // console.log(key);
    //     console.log(req.body[key]);
    // });
    if (req.body.hasOwnProperty('privateKey')) {
        console.log(req.body['privateKey']);
    }
    let number = transaction_1.jiggaloo();
    res.json({
        message: 'Hello Jigga number ' + number
    });
});
exports.routes = router;
