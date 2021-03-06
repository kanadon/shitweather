"use strict"

const config = require("../config");
const RtmClient = require("@slack/client").RtmClient;
const WebClient = require("@slack/client").WebClient;
const CLIENT_EVENTS = require("@slack/client").CLIENT_EVENTS;
const RTM_EVENTS = require("@slack/client").RTM_EVENTS;
let rtm = null;
let web = null;
let nlp = null;

function handleOnAuthenticated(rtmStartData) {
    console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);

}

function handleOnMessage(message) {
    web.users.info(message.user, function (err, info) {
        var x = 1;
    });



    if (message.text.toLowerCase().includes(config.slackBotName)) {
        nlp.ask(message.text, (err, res) => {
            if (err)
                return console.log(err);

            try {
                if (!res.intent || !res.intent[0] || !res.intent[0].value) {
                    throw new Error("Could not extract intent");
                }

                const intent = require(`../intents/${res.intent[0].value}Intent`);

                intent.process(res, function (error, response) {
                    if (error) {
                        console.log(error.message);
                        return;
                    }

                    // return rtm.sendMessage(response, message.channel);

                    return web.chat.postMessage(message.channel, response.text, response.options, function (err, info) {
                        if (err)
                            console.log(err);
                    });
                });
            } catch (err) {
                console.log(err);
                console.log(res);
                rtm.sendMessage("Sorry, I don't know what you are talking about", message.channel);
            }
        });
    }
}

function addAuthenticatedHandler(rtm, handler) {
    rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, handler);
}

exports.init = function (token, logLevel, nlpClient) {
    rtm = new RtmClient(token, {
        logLevel: logLevel
    });
    web = new WebClient(token);
    nlp = nlpClient;
    addAuthenticatedHandler(rtm, handleOnAuthenticated);
    rtm.on(RTM_EVENTS.MESSAGE, handleOnMessage);
    return rtm;
}

exports.addAuthenticatedHandler = addAuthenticatedHandler;