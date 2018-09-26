// Redux-Saga
import { put } from 'redux-saga/effects'
// Events
import eventsMap from './events/user/events.js'
// import { mapEvents } from '../../events/interface/actions'
// Config
// import { update as updateConfig } from '../../config/interface/actions'
// Helpers
// import { defaults } from 'lodash/fp'
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

// import api from './api/user.js'
// import reducer from './reducers/user'
// import userMiddleware from './middleware/user'

// const name = 'user'

// export default function userLink (options = {}) {
//     return {
//         name: name,
//         api: api,
//         reducer: reducer,
//         middleware: userMiddleware
//     }
// }
