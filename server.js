'use strict'

const express = require('express');
const axios = require('axios').default;

// constants
const PORT = 8080;
const HOST='0.0.0.0';

//APP
const app = express();

app.get('/', (req, res) => {

    axios.get('http://192.168.4.170/login.html')
        .then(function (response) {
            // handle success
            console.log(response.status);
            res.send(response.status);
        })
        .catch(function (error) {
            // handle error
            console.log(error);
            res.send(204);
        })
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);


