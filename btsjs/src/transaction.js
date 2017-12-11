"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("poly/arrayIncludes");
const satoshi = 100000000;
const janga = () => {
    return 45;
};
let txAmount = 0.65;
let bitcore = require("bitcore-lib");
// let Insight = require("bitcore-explorers").Insight;
// exports.getInsight = function() {
//     let insight = new Insight("testnet");
//
//     insight.getUnspentUtxos(sourceAddress, function(error, utxos) {
//         if (error) {
//             console.log(error)
//         } else {
//             let checkUtxo = utxos
//             Array.from(utxos).forEach(function(utxo) {
//                 console.dir(utxo)
//             })
//             return utxos;
//
//         }
//     })
// }
// exports.sendTransaction = function() {
//
//     let utxo = {
//         txId: "a0b993b0f3ea76545669b0bc80b1293ababe9304a41a9b16473284b56dae1801",
//         outputIndex: 0,
//         address: sourceAddress,
//         script: new bitcore.Script(sourceAddress).toHex(),
//         // amount: parseInt(txAmount * satoshi),
//         satoshis: parseInt(txAmount * satoshi),
//     }
//
//     console.log(txAmount)
//     let transaction = new bitcore.Transaction()
//         .from(utxo)
//         .to(targetAddress, (txAmount * satoshi) - 1000)
//         .sign(privateKey)
//     console.dir(transaction)
//     let serializedTx = transaction.serialize()
//     console.log(serializedTx)
//     return {transaction, serializedTx}
//
// }
exports.transaction = (...args) => {
    if (args.includes('txId') && args.includes('txOut')) {
        console.dir(args['txId']);
        console.dir(args['txOut']);
    }
    // let senderPrivateKeyWIF = args.senderWif
    // let receivePrivateKeyWIF = args.receiveWif
    // let txId = args.txId
    // let txAmount = args.txAmount
    // let privateKey = bitcore.PrivateKey.fromWIF(senderPrivateKeyWIF)
    // let sourceAddress = privateKey.toAddress(bitcore.Networks.testnet)
    // let targetAddress = (bitcore.PrivateKey.fromWIF(receivePrivateKeyWIF)).toAddress(bitcore.Networks.testnet)
    //
    // let utxo = {
    //     txId: txId,
    //     outputIndex: 0,
    //     address: sourceAddress,
    //     script: new bitcore.Script(sourceAddress).toHex(),
    //     // amount: parseInt(txAmount * satoshi),
    //     satoshis: parseInt(txAmount * satoshi),
    // }
    //
    // console.log(txAmount)
    // let transaction = new bitcore.Transaction()
    //     .from(utxo)
    //     .to(targetAddress, (txAmount * satoshi) - 1000)
    //     .sign(privateKey)
    // console.dir(transaction)
    // let serializedTx = transaction.serialize()
    // console.log(serializedTx)
    // return {transaction, serializedTx}
};
exports.jiggaloo = janga;
