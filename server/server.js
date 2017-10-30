const express = require('express');
const app = express();
const csv = require('csv-parser');
const fs = require('fs');

var locs = [];
var stats = {
    'count': {},
    'cost': {}
};

/** Returns a list of objects containing the latitude and longitude for each listing */
function getLocations() {
    fs.createReadStream('data/listings.csv').pipe(csv())
    .on('data', data => {
        locs.push({'lat': data.latitude, 'lng': data.longitude});
    }).on('end', () => {
        console.log("Finished loading locations data");
    });
}

function getStats() {
    fs.createReadStream('data/listings.csv').pipe(csv())
    .on('data', function(data) {
        /** Count property types */
        if(stats['count'][data.property_type]) {
            stats['count'][data.property_type]++;
        } else {
            stats['count'][data.property_type] = 1;
        }

        /** Average cost per property type per neighborhood */
        if(stats['cost'][data.neighbourhood_cleansed]) {
            var st = stats['cost'][data.neighbourhood_cleansed];
            var price = parseFloat((data.price).replace('$', ''));
            if(st[data.property_type]) {
                st[data.property_type].count++;
                st[data.property_type].price += price;
            } else {
                st[data.property_type] = {
                    'count': 1,
                    'price': price
                }
            }
        } else {
            stats['cost'][data.neighbourhood_cleansed] = {};
        }
    }).on('end', () => {
        console.log("Finished loading averages");
    });
}

app.get('/api/locations', function (req, res) {
    res.send(locs);
});

app.get('/api/stats', function (req, res) {
    res.send(stats);
});

app.listen(5052, function () {
    console.log('Listening on port 5052');
    getStats();
    getLocations();
});