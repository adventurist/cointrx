import { cloneDeep } from 'lodash/fp'


export function getUsers(state) {
    return cloneDeep(state.user)
}