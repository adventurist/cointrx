import initialize from './init'

const trxPlugins = [

]

function trx(options = {}, plugins = []) {
    return initialize(options, [...trxPlugins, ...plugins])
}

module.exports = trx