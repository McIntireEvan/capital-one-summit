const express = require('express');
const app = express();
const csv = require('csv-parser');
const fs = require('fs');

var locs = [];
var stats = {
    'count': [],
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
    var count = {};
    fs.createReadStream('data/listings.csv').pipe(csv())
    .on('data', function(data) {
        /** Count property types */
        if(count[data.property_type]) {
            count[data.property_type]++;
        } else {
            count[data.property_type] = 1;
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
        var sorted = [];
        for(var key in count) {
            if(count.hasOwnProperty(key)) {
                sorted.push({'key': key, 'val': count[key]});
            }
        }
        sorted.sort(function(a, b) {
            return b.val - a.val;
        });
        stats.count = sorted;
        for(var i = 0; i < sorted.length; i++) {
            console.log("key: " + sorted[i].key +" val: " + sorted[i].val);
        }
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