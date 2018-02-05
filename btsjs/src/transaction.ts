import {txFactory, Txin, Txout, NetworkType} from './txbuilder'

export const transaction = (txIn: Array<Txin>, txOut: Array<Txout>, network: string) => {
    return txFactory({
        input: txIn,
        output: txOut,
        network: network
    })
}
