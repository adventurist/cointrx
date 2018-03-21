import initialize from './init'
import user from './user'

const trxPlugins = [
    { name: 'user', fn: user }
]

export default function trx(options = {}, plugins = []) {
    return initialize(options, [...trxPlugins, ...plugins])
}
