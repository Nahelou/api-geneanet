const express = require('express');
const fetch = require("node-fetch");

const router = express.Router();

const API_ADDRESS = "https://api-adresse.data.gouv.fr/search/?q=";

function geocodingAddress(data) {
    return new Promise(async function (res, rej) {
        let geocodedData = [];
        await data.forEach(el => {
            let addToParam = '';
            const add = el.address.split(' ');
            for (let i = 0; i < add.length; i++) {
                if (add[i] != '' && i != add.length - 1) {
                    addToParam = addToParam + add[i] + '+'
                } else if (i == add.length - 1) {
                    addToParam = addToParam + add[i];
                }
            }
            fetch(`${API_ADDRESS}${addToParam}`, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                })
                .then(response =>
                    response.text()
                )
                .then(r => {
                    geocodedData.push(r);
                })
        });

        res(geocodedData);
    })
}

function geocodeAddress(data) {
    let geocodedData = [];
    
    for (const file of data) {
        let addToParam = '';
        const add = file.address.split(' ');
        for (let i = 0; i < add.length; i++) {
            if (add[i] != '' && i != add.length - 1) {
                addToParam = addToParam + add[i] + '+'
            } else if (i == add.length - 1) {
                addToParam = addToParam + add[i];
            }
        }
        geocodedData.push(fetch(`${API_ADDRESS}${addToParam}&limit=1`, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(response => response.text())
            .then(resData => {
                const dataJson = JSON.parse(resData);
                if(!dataJson.title && dataJson.features[0]){
                    for(let property in file){
                        dataJson.features[0].properties[property] = file[property];
                    }
                }
                return dataJson;
            })
            );
    }
    return Promise.all(geocodedData).then(datasetArray => datasetArray.flat());
}

module.exports = {
    geocodingAddress,
    geocodeAddress,
};
