"use strict"

const request = require("superagent");
const config = require("../config");

module.exports = function witClient(token, version) {
    const ask = function ask(message, cb) {
        request.get("https://api.wit.ai/message")
            .set("Authorization", "Bearer " + token)
            .query({
                v: version
            })
            .query({
                q: message
            })
            .end(function (err, res) {
                if (err)
                    return cb(err);

                if (res.statusCode != 200)
                    return cb("Expect status 200 but got " + res.statusCode);

                const witResponse = res.body.entities;
                return cb(null, witResponse);
            })
    }

    return {
        ask: ask
    }
}