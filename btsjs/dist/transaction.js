"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const txbuilder_1 = require("./txbuilder");
exports.transaction = (txIn, txOut, network) => {
    return txbuilder_1.txFactory({
        input: txIn,
        output: txOut,
        network: network
    });
};
