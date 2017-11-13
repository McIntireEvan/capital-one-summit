const express = require('express');
const app = express();
const csv = require('csv-parser');
const fs = require('fs');
const haversine = require('haversine');

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
    var cost = {};
    var ratings = {};

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
        if(cost[data.neighbourhood_cleansed]) {
            cost[data.neighbourhood_cleansed].count++;
            cost[data.neighbourhood_cleansed].price += price;
        } else {
            cost[data.neighbourhood_cleansed] = {
                'count': 1,
                'price': price
            }
        }

        var r_count = parseInt(data.number_of_reviews);
        var score = parseFloat(data.review_scores_rating);

        if(score == score && r_count != 0) {
            /** Ratings per neighborhood */
            if(ratings[data.neighbourhood_cleansed]) {
                ratings[data.neighbourhood_cleansed].count += r_count;
                ratings[data.neighbourhood_cleansed].score += (r_count * score);
            } else {
                ratings[data.neighbourhood_cleansed] = {
                    'count': r_count,
                    'score': (r_count * score)
                }
            }
        }
        //number_of_reviews
        //review_scores_rating
    }).on('end', () => {
        console.log("Loaded data; sorting");
        /** Sort property counts */
        stats.count = sortByValue(count, function(a, b) {
            return b.val - a.val;
        });
        console.log("Finished loading property amounts");

        /** Sort cost per neighborhood */
        stats.cost = sortByValue(cost, function(a, b) {
            return (1.0 * b.val.price / b.val.count) - (1.0 * a.val.price / a.val.count);
        });

        /** Sort ratings per neighborhood */
        stats.ratings = sortByValue(ratings, function(a, b) {
            return (1.0 * b.val.score / b.val.count) - (1.0 * a.val.score / a.val.count);
        });
        console.log("Finished loading average ratings");
    });
}

function getSuggestedPrice(lat, lng) {
    return new Promise((resolve, reject) => {
        var count = 0, price = 0;

        fs.createReadStream('data/listings.csv').pipe(csv())
        .on('data', function(data) {
            if(haversine(
                {'latitude': lat, 'longitude': lng},
                {'latitude': data.latitude, 'longitude': data.longitude},
                {unit: 'mile'})
            <= .3) {
                var p = parseFloat((data.price).replace('$', ''));
                count += 1;
                price += p;
            }
        }).on('end', () => {
            var avg = 1.0 * price / count;
            resolve({price: avg, count: count});
        });
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

app.get('/api/ratings', function (req, res) {
    res.send(stats.ratings);
});

app.get('/api/price', function (req, res) {
    var lat = req.query.lat;
    var lng = req.query.lng;

    getSuggestedPrice(lat, lng).then(data => {
        res.send(data);
    });
});

/** Init express; load data */
app.listen(5052, function () {
    console.log('Listening on port 5052');
    getStats();
    getLocations();
});