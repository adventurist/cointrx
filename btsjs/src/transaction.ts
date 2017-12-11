import * as bitcore from 'bitcore-lib'
import './poly/arrayIncludes'

const satoshi = 100000000

const janga = () => {
    return 45;
}




let txAmount = 0.65
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

const buildTxOut = function(txRaw: Txin): Txribute {
    return {
        txId: txRaw.id,
        outputIndex: 0,
        address: txRaw.key,
        script: new bitcore.Script(txRaw.key).toHex(),
        satoshis: txRaw.value * satoshi
    }
}


export const transaction = (txIn: Array<Txin>, txOut: Array<Txout>) => {

    let value = (txIn) => { return txIn.value }
    let txInFinal = (utXo: Array<Txribute>) => {
        return Array.from(txIn.forEach(d, function() {
            return buildTxOut(d)
        }))
    }
    const transaction = bitcore.Transaction()
        .from(txInFinal[0])
        .to(txOut[0].key, (txOut[0].value * satoshi) - 1000);
        // .sign(txIn[0].address)
    let superMy = 'fluss'
    return superMy;
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

}


export const jiggaloo = janga

interface LabelledValue {
    label: string;
}

function printLabel(labelledObj: LabelledValue) {
    console.log(labelledObj.label);
}

let myObj = {size: 10, label: "Size 10 Object"};
printLabel(myObj);

interface Txribute {
    txId: string,
    outputIndex: number,
    address: string,
    script: any,
    satoshis: number
}

interface Txin {
    key: string,
    id: string,
    value: number
}

interface Txout {
    key: string,
    value: number
}

// const jigga = {
//     txId: d.id,
//     outputIndex: 0,
//     address: d.key,
//     script: new bitcore.Script(d.key).toHex(),
//     satoshis: parseInt(d.value * satoshi)
// }