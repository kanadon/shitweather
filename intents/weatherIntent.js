"use strict"

const config = require("../config");
const request = require("superagent");
const intentName = "weather";
const endpoints = {
    current: "weather",
    future: "forecast",
}
var cache = {}

exports.process = function process(intentData, cb) {
    if (intentData.intent[0].value !== intentName)
        return cb(new Error(`Expected ${intentName} intent, got ${intentData.intent[0].value}`));

    if (!intentData.location)
        return cb(new Error(`Missing location in ${intentName} intent`));

    if (!intentData.datetime) {
        getCurrentWeather(intentData.location[0], function (err, res) {
            return cb(null, res);
        });
    } else {
        getForecast(intentData.location[0].value, parseDateString(intentData.datetime[0].value), function (err, res) {
            return cb(null, res);
        });
    }
}

function getCurrentWeather(city, cb) {
    request.get(`${config.weatherURL}/${endpoints.current}?q=${city}&appid=${config.weatherToken}`, function (err, res) {
        if (err) return cb(err);

        let descriptions = "";
        let icons = "";
        for (let i = 0; i < res.body.weather.length; i++) {
            descriptions += `${res.body.weather[i].description}, `;
            icons += `:${res.body.weather[i].icon}:`;
        }
        descriptions = descriptions.slice(0, -2); //remove last comma and space
        descriptions = descriptions.charAt(0).toUpperCase() + descriptions.slice(1); //capitalize


        const message = {};
        message.text = "";
        message.options = {
            username: "Weatherman",
            attachments: [{
                "fallback": "weather",
                "color": "#36a64f",
                "pretext": `${res.body.name} ${icons}`,
                "text": `${kelvinToCelcius(res.body.main.temp).toFixed(1)} °C \n${descriptions}`,
                "footer": "Fair Weather",
                "ts": (Date.now() / 1000).toFixed(0)
            }]
        };
        return cb(null, message);
    });
}

function getForecast(city, date, cb) {
    const key = city.toLowerCase();
    const dif = (date - adjustOffset(Date.now())) / 1000 / 60 / 60; //diff in hrs

    if (dif < 3) {
        getCurrentWeather(city, cb);
    } else {
        request.get(`${config.weatherURL}/${endpoints.future}?q=${key}&appid=${config.weatherToken}`, function (err, res) {
            if (err)
                return cb(err);


            let forecastInfo = res.body.list[Math.floor(dif / 3)]; // array of 3hr intervals
            let descriptions = "";
            let icons = "";
            for (let i = 0; i < forecastInfo.weather.length; i++) {
                descriptions += `${forecastInfo.weather[i].description}, `;
                icons += `:${forecastInfo.weather[i].icon}:`;
            }
            descriptions = descriptions.slice(0, -2); //remove last comma and space
            descriptions = descriptions.charAt(0).toUpperCase() + descriptions.slice(1); //capitalize
            const message = {};
            const firstDate = adjustOffset(new Date(forecastInfo.dt * 1000));

            message.text = "";
            message.options = {
                username: "Weatherman",
                attachments: [{
                    "fallback": "weather",
                    "color": "#36a64f",
                    "pretext": `${res.body.city.name} ${icons}`,
                    "text": `${kelvinToCelcius(forecastInfo.main.temp).toFixed(1)} °C \n${descriptions}`,
                    "footer": "Fair Weather",
                    "ts": (Date.now() / 1000).toFixed(0)
                }]
            };
            return cb(null, message);
        });
    }
}

function kelvinToCelcius(temp) {
    return (+temp - 273.15);
}

function parseDateString(dateString) {
    // dateString format: 2016-12-13T23:30:00.000-08:00
    return new Date(dateString.slice(0, -10));
}

function adjustOffset(date) {
    return new Date(date - 300 * 60 * 1000);
}