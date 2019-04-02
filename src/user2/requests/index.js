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
        url: 'https://api.timezonedb.com/v2.1/get-time-zone',
        params: {
            key,
            format: 'json',
            by: 'zone',
            zone
        }
    })

    return handleResponse(response)
}


/**
 * @request
 * @param {Object} credentials
 * @returns {RequestObject|Object} an Object containing response codes, body and error information
 */
export async function fetchKeyRequest(credentials) {
  const response = await request({
    url: '/keys/btc/regtest/generate',
    headers: {
      'csrf-token': credentials.csrf,
      'Content-Type': 'application/json',
    },
    method: 'POST'
  })

  return handleResponse(response)
}


/**
 * TODO: Complete implementation after the back end API is finished
 * @request
 * @param {Object} credentials
 * @returns {RequestObject|Object} an Object containing a status code, body (optional) and error information
 */

 export async function expireKeyRequest(credentials) {
   const response = await request({
     url: ''
   })

   return handleResponse(response)
 }