import { setToken } from './actions'

export default function api(context) {

    const authApi = {
        setToken: (token) => {
            context.dispatch(setToken(token))
        },
        setCredentials: (credentials) => {
            context.dispatch(setCredentials(credentials))
        }
    }

    return { auth: authApi }
}
