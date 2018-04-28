export async function request(options) {
    const {
        url,
        method,
        params,
        body,
        headers
    } = {...options}

    let queryString
    let requestHeaders
    let requestOptions

    if (params) {
        let keys = Object.keys({...params})
        if (keys.length > 0) {
            queryString = '?' + keys.map(key => `${key}=${params[key]}`).join('&')
        }
    }

    if (headers) {
        let keys = Object.keys({...headers})
        if (keys.length > 0) {
            requestHeaders = headers
        }
    }

    requestOptions = {
        method: method !== void 0 ? method : 'GET',
        body: body !== void 0 ? body : '',
        headers: requestHeaders
    }

    if (requestOptions.method === 'GET') {
        delete requestOptions.body
    }


    const response = await fetch(`${url}${queryString ? queryString : ''}`, requestOptions)
    if (response) {
        let error = response.error
        const responseData = await response.json()
        return {
            body: responseData,
            error: error !== undefined ? error : false,
        }
    }
    // return fetch('http://localhost:6969/bot/start' + queryString, requestOptions)
    //     .then(response => {
    //         let error = response.error
    //         return response.json()
    //             .then(responseBody => {
    //                 return {
    //                     body: responseBody,
    //                     error: error !== undefined ? error : false,
    //                 }
    //             })
    //     })
}

export function handleResponse(response) {
    const data = typeof response === 'string' ? JSON.parse(response) : response
    let error = false
    if ('error' in data) {
            error = data.error
    }

    return {
        body: 'body' in response ? response.body : false,
        error: error,
        code: 'code' in response ? response.body : false,
    }
}