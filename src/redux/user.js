import api from './api/user.js'
import reducer from './reducers/user'
import userMiddleware from './middleware/user'

const name = 'user'

export default function userLink (options = {}) {
    return {
        name: name,
        api: api,
        reducer: reducer,
        middleware: userMiddleware
    }
}
