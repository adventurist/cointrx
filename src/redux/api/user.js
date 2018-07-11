import { fetchUsers, fetchUser } from '../actions/user/actions'

export default function api(context) {

    const userApi = {
        fetchUsers: function() {
            context.dispatch(fetchUsers())
        },
        fetchUser: (id) => context.dispatch(fetchUser(id))
    }

    return {user: userApi}
}