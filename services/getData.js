let config = require("../config/config");
let postServiceCall = require("./common").postServiceCall;
const q = require("q");

function getData(payload) {
    let deferred = q.defer();
    let url = config.url.getData;
    postServiceCall("POST", url, payload)
        .then((result) => {
            deferred.resolve(result);
        })
        .catch((error) => {
            return deferred.reject(error);
        });
    return deferred.promise;
}

function saveData(payload) {
    console.log("Payload To Insert In DB ", payload);
    const deferred = q.defer()
    const url = config.url.saveData
    postServiceCall('POST', url, payload)
        .then((result) => {
            deferred.resolve(result)
        })
        .catch((error) => {
            deferred.reject(error)
        })
    return deferred.promise
}

module.exports.getData = getData;
module.exports.saveData = saveData;
