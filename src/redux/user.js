// Redux-Saga
import { put } from 'redux-saga/effects'
// Events
import eventsMap from './events/user/events.js'
// Sagas
import { userSaga } from './middleware/user/sagas'
// User module
import userApi from './api/user'
import reducer from './reducers/user'

// The interface to implement.
// import pluginInterface from '../interface'

export default function trxUser (options = {}) {

    // options = defaults(defaultOptions, options)

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
        api: userApi,
        name: 'Users',
        reducer: reducer,
        // mixins: pluginInterface.mixins
    }
}
