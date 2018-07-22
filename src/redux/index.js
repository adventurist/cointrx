import initialize from './init'
import user from './user'

const trxPlugins = [
    { name: 'user', fn: user }
]

export default function trx(options = {}, plugins = []) {
    // return initialize(options, [...trxPlugins, ...plugins])
    const initializedState = initialize(options, trxPlugins)
    console.log('stop here and see')

    return initializedState
}
