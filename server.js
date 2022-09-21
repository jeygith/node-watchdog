'use strict'

const express = require('express');
const axios = require('axios').default;
const {Resolver} = require('dns');
const dns = require("dns");
var ping = require("ping");
const resolver = new Resolver();
resolver.setServers(['192.168.11.82']);

// constants
const PORT = 8080;
const HOST = '0.0.0.0';

const hostList = [
    {
        name: 'mwai-router',
        type: 'https',
        addr: 'http://10.0.160.170'
    },
    {
        name: 'savier-dns',
        type: 'dns',
        addr: '192.168.11.82'
    },
    {
        name: 'savier-ping',
        type: 'ping',
        addr: '192.168.11.82'
    }
]

//APP
const app = express();

app.get('/', (req, res) => {
    axios.get('https://192.168.11.82/')
        .then(function (response) {
            // handle success
            console.log(response.status);
            res.send(response.status);
        })
        .catch(function (error) {
            // handle error
            console.log(error.message);
            res.send(500);
        })
});

app.get('/watchdog/:host', (req, res) => {
    let host = req.params.host
    console.log(host);

    if (!host || host.length == 0) {
        console.log('empty request');
        res.send(400);
        return;
    }

    let existingHost = hostList.find(x => x.name === host);


    if (!existingHost) {
        console.log('non-existing host');
        res.send(400);
        return;
    }

    switch (existingHost.type) {
        case 'https':
            axios.get(existingHost.addr)
                .then(function (response) {
                    // handle success
                    console.log(response.status);
                    res.send(response.status);
                })
                .catch(function (error) {
                    // handle error
                    console.log(error.message);
                    res.send(500);
                });
            break;
        case 'dns':
            resolver.setServers([existingHost.addr]);
            resolver.resolve4('google.com', (err, addresses) => {
                // ...
                if (err) {
                    console.log(err);
                    res.sendStatus(500);
                }
                console.log(addresses[0]);
                res.sendStatus(200);
            });
            break;
        case 'ping':
            ping.sys.probe(existingHost.addr, function (isAlive) {
                var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
                console.log(msg);

                if (isAlive) {
                    res.sendStatus(200);
                } else {
                    res.send(500);
                }

            });

            break;

        default:
            console.log('no lookup type');
            res.send(500);
    }
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);


