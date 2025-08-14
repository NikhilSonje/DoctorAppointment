const request = require('request')
const q = require("q");
const _ = require("underscore");
// const { response } = require('../app');

function postServiceCall(method, url, payload, cookie) {
    let header = ''
    if (cookie) {
        header = {
            cookie: cookie,
            'content-type': 'application/json'
        }
    } else {
        header = {
            'content-type': 'application/json'
        }
    }
    const deferred = q.defer()
    const options = {
        method: method,
        url: url,
        strictSSL: false,
        headers: header,
        body: payload,
        json: true
    }

    request(options, function (error, response, body) {
        if (error) {
            console.log("Error Follow:", error)
            return deferred.reject(error)
        } else {
            if (_.has(body, 'message')) {
                deferred.resolve({ body: body, statusCode: response.statusCode, message: body.message, result: body.result })
            } else {
                deferred.resolve({ body: body, statusCode: response.statusCode })
            }
        }
    });
    return deferred.promise
}

module.exports.postServiceCall = postServiceCall;