// Redux-Saga
import { put } from 'redux-saga/effects'
// Events
import eventsMap from './interface/events/events'
// Sagas
import * as authSagas from './sagas'
// Auth module
import authApi from './interface/api'
import reducer from './interface/reducers'

// The interface to implement.
// import pluginInterface from '../interface'

export default function auth (options = {}) {


    function * init () {
        // yield put(updateConfig(options, pluginInterface.name))
        yield put(mapEvents(eventsMap))
    }

    const capabilities = [
        'trxAuthentication'
    ]

    return {
        sagas: Object.values(authSagas),
        capabilities,
        init,
        api: authApi,
        name: 'Auth',
        reducer: reducer,
        // mixins: pluginInterface.mixins
    }
}
