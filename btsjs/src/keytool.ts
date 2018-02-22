import {Address, Networks, Script, PrivateKey, Transaction} from 'bitcore-lib'

Networks.enableRegtest()

export const convertWifToPrivate = (config) => {
    const bitcoinKey = new BitcoinKey(config)
    if (bitcoinKey) {
        return bitcoinKey.toPrivateKey()
    }
}

class BitcoinKey {

    private bitcoinKey: PrivateKey

    public constructor(public config : BitcoinKeyConfig) {
        this.config = config
        if (!config.multi) {
            this.bitcoinKey = PrivateKey.fromWIF(this.config.wif)
        }
    }

    public toPrivateKey () : string {
        if (this.bitcoinKey) {
            return this.bitcoinKey.toString()
        }
    }
}

interface BitcoinKeyConfig {
    wif: string,
    multi: boolean
}