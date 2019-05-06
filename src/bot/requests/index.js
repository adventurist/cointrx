import { request, handleResponse } from '../../utils'

/**
 * @request
 * @returns {RequestObject|Object} an Object containing response codes, body and error information
 */
export async function fetchTradeParts() {
  const bids = await fetchBids()
  const offers = await fetchOffers()
  if (!bids.error && !offers.error) {
    return { bids: bids.body, offers: offers.body }
  } else {
    return {
      ...bids, ...offers, error: true, result: [bids.error, offers.error]
    }
  }
}

/**
 *
 */
async function fetchBids() {
  const response = await request({
    url: '/bid',
    method: 'GET'
  })

  return handleResponse(response)
}

/**
 *
 */
async function fetchOffers() {
  const response = await request({
    url: '/offer',
    method: 'GET'
  })

  return handleResponse(response)
}

/**
 *
 * @param {*} options
 */
export async function bidRequest (options) {
  const response = await request({
    url: '/bid',
    method: 'POST',
    body: {
        uid: options.user.uid,
        rate: options.price,
        amount: options.amount,
        date: options.date,
        currency: 'CAD'
    }
  })
  return handleResponse(response)
}

/**
 *
 * @param {*} options
 */
export async function offerRequest (options) {
  const response = await request({
    url: '/offer',
    method: 'POST',
    body: {
        uid: options.user.uid,
        rate: options.price,
        amount: options.amount,
        date: options.date,
        currency: 'CAD'
    }
  })
  return handleResponse(response)
}