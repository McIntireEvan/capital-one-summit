const express = require('express');
const app = express();
const csv = require('csv-parser');
const fs = require('fs');

/** Returns a list of objects containing the latitude and longitude for each listing */
function getLocations() {
    return new Promise((resolve, reject) => {
        var locs = [];
        fs.createReadStream('data/listings.csv').pipe(csv())
        .on('data', function(data) {
            locs.push({'latitude': data.latitude, 'longitude': data.longitude});
        }).on('end', function() {
            resolve(locs);
        });
    });
}

app.get('/api', function (req, res) {
    getLocations().then(function(data) {
        res.send(data);
    });
})

app.listen(5052, function () {
  console.log('Listening on port 5052!');
})