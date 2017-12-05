"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = express_1.Router();
// placeholder route handler
router.get('/', (req, res, next) => {
    res.json({
        message: 'Hello World!'
    });
});
router.post('/transaction', (req, res, next) => {
    console.dir(req.body);
    res.json({
        message: 'Hello Jigga!'
    });
});
exports.routes = router;
