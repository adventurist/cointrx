import {Address, Networks, Script, PrivateKey, Transaction} from 'bitcore-lib'

Networks.enableRegtest()

const satoshi = 100000000


export const txFactory = (config) => {
    const tx = new TrxTransaction(config);
    if (typeof tx !== 'undefined') {
        const txResult = tx.createTransaction(tx.input, tx.output)
        return txResult.error === 0 ? txResult : 'error'
    }
}

class TrxTransaction {
    type: TxTypes
    input: Array<Txin>
    output: Array<Txout>
    network: NetworkType

    constructor(config) {
        this.input = config.input
        this.output = config.output
        this.type = findTxType(config.input)
        this.network = config.network
    }

    createTransaction (txIn: Array<Txin>, txOut: Array<Txout>) {
        let txInFinal = finalizeTxIn(txIn)
        let txOutFinal = finalizeTxOut(txOut)
        let keys = txIn.map(x => PrivateKey.fromWIF(x.key))

        const transaction = Transaction()
            .from(txInFinal)
            .to(txOutFinal)
            .sign(keys);

        console.log('Transaction: ' + transaction)
        let errors = typeof transaction !== 'undefined' ? 0 : 1

        return { tx: transaction.serialize(), error: errors }
    }
}

enum NetworkTypes {
    main = 'main',
    testnet = 'testnet'
}

export interface NetworkType {
    type: NetworkTypes
}

enum TxTypes {
    simple,
    multi
}

interface TxType {
    type: TxTypes
}

interface Txribute {
    txId: string,
    outputIndex: number,
    address: string,
    script: any,
    satoshis: number
}

export interface Txin {
    address: string,
    id: string,
    idx: number,
    value: number,
    key: string
}

export interface Txout {
    address: string,
    value: number
}

const buildTxIn = (txRaw: Txin): Txribute => {
    return {
        txId: txRaw.id.indexOf(':0') ? txRaw.id.substr(0, txRaw.id.indexOf(':0')) : txRaw.id,
        outputIndex: txRaw.idx,
        address: new Address(txRaw.address, 'testnet'),
        script: new Script(PrivateKey.fromWIF(txRaw.key).toAddress(Networks.testnet)).toHex(),
        satoshis: txRaw.value
    }
}


const buildTxOut = function(txRaw: Txout) {
    return {
        satoshis: txRaw.value,
        address: Address(txRaw.address, 'testnet')
    }
}

const finalizeTxIn = (txIn: Array<Txin>) => {
    return txIn.map(d => buildTxIn(d))
}

const finalizeTxOut = (txOut: Array<Txout>) => {
    return txOut.map(d => buildTxOut(d))
}

const findTxType = (txIn: any): TxTypes => {
    const isMulti = !!txIn.reduce((a, b) => { return ( a.address === b.address ) })
    return isMulti ? TxTypes.multi : TxTypes.simple
}