import initialize from './init'
import user from './user'
import auth from './auth'

const trxPlugins = [
    { name: 'auth', fn: auth },
    { name: 'user', fn: user },
]

export default function trx(options = {}, plugins = []) {
    // return initialize(options, [...trxPlugins, ...plugins])
    const initializedState = initialize(options, trxPlugins)
    console.log('stop here and see')

    return initializedState
}
