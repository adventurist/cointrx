"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bitcore_lib_1 = require("bitcore-lib");
const satoshi = 100000000;
exports.txFactory = (config) => {
    const tx = new TrxTransaction(config);
    if (typeof tx !== 'undefined') {
        return tx.createTransaction(tx.input, tx.output);
    }
};
class TrxTransaction {
    constructor(config) {
        this.input = config.input;
        this.output = config.output;
        this.type = findTxType(config.input);
        this.network = config.network;
    }
    createTransaction(txIn, txOut) {
        let txInFinal = finalizeTxIn(txIn);
        let txOutFinal = finalizeTxOut(txOut);
        let keys = txIn.map(x => bitcore_lib_1.PrivateKey.fromWIF(x.key));
        const transaction = bitcore_lib_1.Transaction()
            .from(txInFinal)
            .to(txOutFinal)
            .sign(keys);
        return transaction.serialize();
    }
}
var NetworkTypes;
(function (NetworkTypes) {
    NetworkTypes["main"] = "main";
    NetworkTypes["testnet"] = "testnet";
})(NetworkTypes || (NetworkTypes = {}));
var TxTypes;
(function (TxTypes) {
    TxTypes[TxTypes["simple"] = 0] = "simple";
    TxTypes[TxTypes["multi"] = 1] = "multi";
})(TxTypes || (TxTypes = {}));
const buildTxIn = function (txRaw) {
    return {
        txId: txRaw.id.indexOf(':0') ? txRaw.id.substr(0, txRaw.id.indexOf(':0')) : txRaw.id,
        outputIndex: 0,
        address: new bitcore_lib_1.Address(txRaw.address, 'testnet'),
        script: new bitcore_lib_1.Script(bitcore_lib_1.PrivateKey.fromWIF(txRaw.key).toAddress(bitcore_lib_1.Networks.testnet)).toHex(),
        satoshis: txRaw.value
    };
};
const buildTxOut = function (txRaw) {
    return {
        satoshis: txRaw.value,
        address: bitcore_lib_1.Address(txRaw.address, 'testnet')
    };
};
const finalizeTxIn = (txIn) => {
    return txIn.map(d => buildTxIn(d));
};
const finalizeTxOut = (txOut) => {
    return txOut.map(d => buildTxOut(d));
};
const findTxType = (txIn) => {
    const isMulti = !!txIn.reduce((a, b) => { return (a.address === b.address); });
    return isMulti ? TxTypes.multi : TxTypes.simple;
};
