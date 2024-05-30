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

const hostList = [{
    name: 'mwai-router', type: 'https', addr: 'http://10.0.160.170'
}, {
    name: 'savier-dns', type: 'dns', addr: '192.168.11.82'
}, {
    name: 'savier-ping', type: 'ping', addr: ['192.168.11.82']
}, {
    name: 'jeff-phone', type: 'ping', addr: ['10.0.10.4', '10.1.0.101', '10.1.2.11']
}, {
    name: 'jeff-windows-laptop', type: 'ping', addr: ['10.0.10.10', '10.1.0.102', '10.1.0.104']
}, {
    name: 'safaricom-dns', type: 'dns', addr: '192.168.1.254'
}, {
    name: 'safaricom-ping', type: 'ping', addr: ['192.168.1.254']
}]

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
                    res.sendStatus(500);
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
            getResults();
            break;
        default:
            console.log('no lookup type');
            res.sendStatus(500);
    }


    async function getResults() {
        let results = [];

        for (const address of existingHost.addr) {
            let result = await processAddress(address);
            console.log(result);
            results.push(result);
        }
        console.log("All results", results);

        // check if all results are false, return 500 if all dead else 200 if one is alive
        let isDead = results.every(result => result === 'false');
        console.log("isDead", isDead);
        if (isDead) {
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    }

    function processAddress(address) {
        return new Promise((resolve, reject) => {
            ping.sys.probe(address, (isAlive) => {
                if (isAlive) {
                    resolve("true");
                }
                resolve("false");
            })
        })
    }
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);


