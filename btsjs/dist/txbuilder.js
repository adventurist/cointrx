"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bitcore_lib_1 = require("bitcore-lib");
const bitcoin = require("bitcoinjs-lib");
bitcore_lib_1.Networks.enableRegtest();
const satoshi = 100000000;
exports.txFactory = (config) => {
    const tx = new TrxTransaction(config);
    if (typeof tx !== 'undefined') {
        const txResult = tx.createTransaction(tx.input, tx.output);
        return txResult.error === 0 ? txResult : 'error';
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
        let errors = typeof transaction !== 'undefined' ? 0 : 1;
        return { tx: transaction.serialize(), error: errors };
        // const txBuilder = buildTx(txIn, txOut)
        // const buildResult = txBuilder.build()
        // const errors = typeof buildResult !== 'undefined' ? 0 : 1
        // return { tx: buildResult.toHex(), error: errors }
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
const buildTxIn = (txRaw) => {
    return {
        txId: txRaw.id.indexOf(':0') ? txRaw.id.substr(0, txRaw.id.indexOf(':0')) : txRaw.id,
        outputIndex: txRaw.idx,
        address: new bitcore_lib_1.Address(txRaw.address, 'testnet'),
        script: new bitcore_lib_1.Script(bitcore_lib_1.PrivateKey.fromWIF(txRaw.key).toAddress(bitcore_lib_1.Networks.testnet)).toHex(),
        satoshis: txRaw.value
    };
};
const buildTx = (txIns, txOuts) => {
    const txBuilder = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
    txIns.forEach((txIn) => {
        txBuilder.addInput(txIn.id.indexOf(':0') ? txIn.id.substr(0, txIn.id.indexOf(':0')) : txIn.id, txIn.idx);
    });
    txOuts.forEach((txOut) => {
        txBuilder.addOutput(txOut.address, txOut.value);
    });
    txIns.forEach((txIn) => {
        try {
            txBuilder.sign(txIn.idx, bitcoin.ECPair.fromWIF(txIn.key, bitcoin.networks.testnet));
        }
        catch (e) {
            console.log(e);
        }
    });
    return txBuilder;
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
