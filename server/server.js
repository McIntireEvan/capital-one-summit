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

/**
 * Sorts JSON objects by value, but changes the format from
 * `obj[key] = val` to `{key: key, val: val}`
 */
function sortByValue(obj, cmp) {
    var sorted = [];

    for(var key in obj) {
        if(obj.hasOwnProperty(key)) {
            sorted.push({'key': key, 'val': obj[key]});
        }
    }

    sorted.sort(cmp);

    return sorted;
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

        var price = parseFloat((data.price).replace('$', ''));

        /** Average cost per neighborhood */
        if(stats['cost'][data.neighbourhood_cleansed]) {
            stats['cost'][data.neighbourhood_cleansed].count++;
            stats['cost'][data.neighbourhood_cleansed].price += price;
        } else {
            stats['cost'][data.neighbourhood_cleansed] = {
                'count': 1,
                'price': price
            }
        }

        /** Ratings per neighborhood */
        //number_of_reviews
        //review_scores_rating
    }).on('end', () => {
        /** Sort property counts */
        stats.count = sortByValue(count, function(a, b) {
            return b.val - a.val;
        });
        console.log("Finished loading property amounts");

        /** Sort cost per neighborhood */
        stats.cost = sortByValue(stats.cost, function(a, b) {
            return (1.0 * b.val.price / b.val.count) - (1.0 * a.val.price / a.val.count);
        });
        console.log("Finished loading average costs");
    });
}

/** Expres routes for the data */
app.get('/api/locations', function (req, res) {
    res.send(locs);
});

app.get('/api/properties', function (req, res) {
    res.send(stats.count);
});

app.get('/api/avgcost', function (req, res) {
    res.send(stats.cost);
});

/** Init express; load data */
app.listen(5052, function () {
    console.log('Listening on port 5052');
    getStats();
    getLocations();
});