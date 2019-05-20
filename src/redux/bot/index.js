// Redux-Saga
import { put } from 'redux-saga/effects'
// Events
import eventsMap from './interface/events/events'
// Sagas
// import * as botSagas from './sagas'
// Auth module
import botApi from './interface/api'
import reducer from './interface/reducers'

// The interface to implement.
// import pluginInterface from '../interface'

export default function bot (options = {}) {


    function * init () {
        // yield put(updateConfig(options, pluginInterface.name))
        yield put(mapEvents(eventsMap))
    }

    const capabilities = [
        'accessBots'
    ]

    return {
        // sagas: Object.values(authSagas),
        capabilities,
        init,
        api: botApi,
        name: 'Bot',
        reducer: reducer
    }
}
