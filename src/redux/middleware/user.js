import * as actionTypes from '../actions/user/actionTypes'
// Redux-Saga
import { put } from 'redux-saga/effects'
// Events
// import eventsMap from '../interface/events'
// import { mapEvents } from '../../events/interface/actions'
// Config
// import { update as updateConfig } from '../../config/interface/actions'
// Helpers
import { defaults } from 'lodash/fp'
// Sagas

import { userSaga } from './user/sagas'

// The interface to implement.
// import pluginInterface from '../interface'

export default function trxUser (options = {}) {

    options = defaults(defaultOptions, options)

    function * init () {
        yield put(updateConfig(options, pluginInterface.name))
        yield put(mapEvents(eventsMap))
    }

    const capabilities = [
        'userAuthentication'
    ]

    return {
        sagas: [userSaga],
        capabilities,
        init,
        api: pluginInterface.api,
        name: pluginInterface.name,
        reducer: pluginInterface.reducer,
        mixins: pluginInterface.mixins
    }
}