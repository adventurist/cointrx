import { request, handleResponse } from '../../utils'

export async function userUpdateRequest(user, credentials) {
  const response = await request({
    url: `/api/user/${String('0000' + user.id).slice(-4)}`,
    headers: {
      'csrf-token': credentials.csrf,
      'Content-Type': 'application/json'
    },
    method: 'PUT',
    body: { ...user }
  })

  return handleResponse(response)
}


export async function fetchTimezoneRequest(zone) {
  const key = 'Z5AO3MSZ12UV'

    const response = await request({
        url: 'http://api.timezonedb.com/v2.1/get-time-zone',
        params: {
            key,
            format: 'json',
            by: 'zone',
            zone
        }
    })

    return handleResponse(response)
}
