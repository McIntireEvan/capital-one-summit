# Airbnb Data Visualization

This is my application to the Capital One Software Engineering Summit.

It contains several charts with different statistics about Airbnb listings in
San Francisco. It also has a heatmap that can be used to estimate a price for a
new listing in the area. I also included some thoughts about the data and in some
cases, further analysis that could be done.

## Setup
First, clone from `https://github.com/McIntireEvan/capital-one-summit`.

Next, grab the data from [here](https://s3.amazonaws.com/mindsumo/public/capital-one/airbnb-public-sep-2017-v2.zip)

Extract all the data, and put `listings.csv` in `/server/data`

Then, from the root directory of the project, run
```
cd server
npm install
node server.js
```
to get all the dependencies installed and the server running.

The server does not serve any static files; it just parses and returns data.
To get everything properly set up with nginx, add the following to your config
```
upstream express-data {
    server localhost:5052;
}

server {
    listen 80; # Or whatever port you want
    server_name localhost;
    root /var/www/data-vis/static; # Or wherever you install to

    index index.html;
    location / {
        try_files $uri $uri/ @express-data;
    }

    location @express-data {
        proxy_redirect off;
        proxy_http_version 1.1;
        proxy_pass http://express-data;
        proxy_set_header Host $host ;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
This tells nginx to first try to find the files, and to fall back on our express
server if it can't locate it.

You'll also have to grab a Google Maps API key from
[here](https://developers.google.com/maps/).

Once you have it, just go to the `<script>` tag near the bottom of `index.html`,
find the `?key=` parameter in the URL, and replace mine with yours

After this, you're done! Go to your webpage, and enjoy!

## Project Structure

All the static files to be served by the webserver are in `static/`

The server and npm package info are in `server/`

## Libraries Used

* Express
* csv-parse
* chart.js
* Google Maps
* haversine

## Other considerations; Possible improvements

* On the server, caching the data instead of directly storing it would improve
memory usage, but with the scope of the project right now is not worth it.

* When getting data to suggest a price, if there fewer data points than some
threshold, it should expand the search radius until we have enough

* The CSS is a mess and could be cleaned up a lot.

* The chart options and related code could be abstracted to follow DRY