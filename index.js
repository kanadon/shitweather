var config = require("./config");
var http = require("http");
var express = require("express");
var app = express();

app.get("/", function (req, res) {
    res.send("foo");
});

app.get("/:intent/:port", function (req, res) {
    const serviceIntent = req.params.intent;
    const servicePort = req.params.port;

    // Checking for IPv6
    const serviceIp = req.connection.remoteAddress.includes("::") ? `[${req.connection.remoteAddress}]` : req.connection.remoteAddress;

    res.json({
        result: `${serviceIntent} at ${serviceIp}:${servicePort}`
    });
});

app.listen(config.appPort, function () {
    console.log("listening on " + config.appPort);
});

const witClient = require("./clients/witClient")(config.witServerToken, config.witVersion);
const slackClient = require("./clients/slackClient");
const rtm = slackClient.init(config.slackBotToken, config.slackLogLevel, witClient);

rtm.start();