"use strict"

// IntentData comes in the form of a JSON file
const request = require("superagent");

module.exports.process = function process(intentData, cb) {
    if (intentData.intent[0].value !== "weather") {
        return cb(new Error(`Expected weather intent, got ${intentData.intent[0].value}`));
    }

    if (!intentData.location) {
        return cb(new Error("Missing location in weather intent"));
    }

    const location = intentData.location[0].value;

    request.get(`http://localhost:3000/${location}`, function(err, res) {
        if (err || res.statusCode != 200 || !res.body.result) {
            console.log(err);
            console.log(res.body);

            return cb(false, `I had a problem finding out the weather in ${location}`);
        }

        return cb(false, `In ${location}, it is now ${res.body.result}`);
    });
}