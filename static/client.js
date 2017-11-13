"use strict";

/** Variables for Google Maps API */
var map, heatmap, marker;

/** Colors to use for data  */
var colors = ['#F28181','#E99ACA','#A4C4F8','#4FE7EB','#81FBAF','#EDFE74'];

/** Toggles #prop_types chart */
var mainChartVisible = true;

/** Initializes the Google Maps API map */
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.775, lng: -122.434},
        zoom: 13,
        gestureHandling: 'cooperative'
    });

    var marker = new google.maps.Marker({
        position: {lat: 37.775, lng: -122.434},
        map: map,
        draggable: true
    });

    function requestData(lat, lng) {
        $.getJSON('/api/price', { lat: lat, lng: lng }).done(data => {
            var p = Math.round(data.price);
            $('#price-suggest').text('$' + p);
            $('#count-suggest').text(data.count);
            $('#price-suggest-week').text('$' + (p * 7));
        });
    }

    marker.addListener('dragend', evt => {
        requestData(evt.latLng.lat(), evt.latLng.lng())
        $('#lat-in').val(evt.latLng.lat().toFixed(7));
        $('#lng-in').val(evt.latLng.lng().toFixed(7));
    });

    requestData(37.775, -122.434);
    $('#lat-in').val(37.775);
    $('#lng-in').val(-122.434);

    function onEdit() {
        console.log($('#lat-in').val());
        marker.setPosition(new google.maps.LatLng({
            lat: parseFloat($('#lat-in').val()),
            lng: parseFloat($('#lng-in').val())
        }));
    }

    $('#lat-in').on('input', onEdit);
    $('#lng-in').on('input', onEdit);
}

/**
 * Converts an array of JSON LatLng values to the google maps format
 * @param {Object[]]} arr - Array of {"lat":"<num>", "lng":"<num>"} values
 */
function jsonToLatLng(arr) {
    var ret = new google.maps.MVCArray();
    for(var i = 0; i < arr.length; i++) {
        var loc = arr[i];
        var lat = parseFloat(arr[i].lat);
        var lng = parseFloat(arr[i].lng);
        ret.push(new google.maps.LatLng(lat, lng));
    }
    return ret;
}

/** Once the page is loaded, do all of our JS */
$(document).ready(() => {
    /** chart.js defaults */
    Chart.defaults.global.title.display = true;
    Chart.defaults.global.title.fontSize = 30;
    Chart.defaults.global.title.fontColor = '#ffffff';
    Chart.defaults.global.legend.display = false;

    /** Get location data for heatmap; load into google maps */
    $.getJSON('api/locations').done(function(data) {
        heatmap = new google.maps.visualization.HeatmapLayer({
            data: jsonToLatLng(data),
            map: map,
        });
    });

    /** Get property type counts; display charts  */
    $.getJSON('api/properties').done(data => {
        var dataset = [], dataset2 = [];
        var labels = [], labels2 = [];

        /** Holds the count that will go into "other" */
        var otherVal = 0;

        /**
         * Processes the data for the first chart; the highest 2 values
         * are listed, and the rest is put in "other"
         *
         * TODO: Make this generalize to other data sets; i.e. pick a number
         * of things to put in "other" based on count
         */
        for(var i = 0; i < data.length; i++) {
            if(i < 2) {
                dataset.push(data[i].val);
                labels.push(data[i].key);
            } else {
                otherVal += data[i].val;
            }
        }

        /** Add "other" to the data and labels for the chart */
        dataset.push(otherVal);
        labels.push("Other");

        /** Load the rest of the data to go into the second chart */
        for(var i = 2; i < data.length; i++) {
            dataset2.push(data[i].val);
            labels2.push(data[i].key);
        }

        /** Init the main chart */
        var propertyTypeChart = new Chart("prop_types", {
            type: 'horizontalBar',
            data: {
                datasets: [{'data': dataset, backgroundColor:
                    [colors[0], colors[3], colors[4]]
                }],
                labels: labels
            },
            options: {
                title: {
                    text: 'Top property types'
                },
                scales: {
                    xAxes: [{
                        gridLines:{
                            display: false
                        },
                        ticks: {
                            fontColor: "#ffffff",
                            fontSize: 20,
                            maxRotation: 0,
                            minRotation: 0,
                            stepSize: 1000
                        },
                        scaleLabel: {
                            display: true,
                            labelString: '# of properties',
                            fontColor: "#ffffff",
                            fontSize: 20
                        }
                    }], yAxes: [{
                        gridLines:{
                            display: false
                        },
                        ticks: {
                            fontColor: "#ffffff",
                            fontSize: 16
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Property Type',
                            fontColor: "#ffffff",
                            fontSize: 20
                        }
                    }]
                }
            }
        });

        /** Init the second chart */
        var propertyTypeChart2 = new Chart("prop_types2", {
            type: 'horizontalBar',
            data: {
                datasets: [{'data': dataset2, backgroundColor: colors[4]}],
                labels: labels2
            },
            options: {
                title: {
                    text: 'Other property types'
                },
                scales: {
                    xAxes: [{
                        gridLines:{
                            display: false
                        },
                        ticks: {
                            fontColor: "#ffffff",
                            fontSize: 20,
                            maxRotation: 0,
                            minRotation: 0,
                            stepSize: 100
                        },
                        scaleLabel: {
                            display: true,
                            labelString: '# of properties',
                            fontColor: "#ffffff",
                            fontSize: 20
                        }
                    }], yAxes: [{
                        gridLines:{
                            display: false
                        },
                        ticks: {
                            fontColor: "#ffffff",
                            fontSize: 16
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Property Type',
                            fontColor: "#ffffff",
                            fontSize: 20
                        }
                    }]
                }
            }
        });

        /**
         * Hide the second property chart
         * This is done with JS instead of CSS because otherwise, chart.js
         * does not properly initialize the element if 'display' is 'none'
         */
        $("#prop_types2").css('display', 'none');
    });

    $.getJSON('api/avgcost').done(data => {
        var dataset = [], labels = [], cost = 0, count = 0, total = 0;

        for(var i = 0; i < data.length; i++) {
            labels.push(data[i].key);
            dataset.push((1.0 * data[i].val.price) / data[i].val.count);

            count += data[i].val.count;
            cost += data[i].val.price;
        }

        total = (1.0 * cost) / count;
        $('#total').text("$" + total.toFixed(2));

        var neighborhood_costs = new Chart("neighborhood_costs", {
            type: 'horizontalBar',
            data: {
                datasets: [{'data': dataset, backgroundColor: colors[3]}],
                labels: labels
            },
            options: {
                title: {
                    text: 'Average cost per night per neighborhood'
                },
                scales: {
                    xAxes: [{
                        gridLines:{
                            display: false
                        },
                        ticks: {
                            fontColor: "#ffffff",
                            fontSize: 20,
                            maxRotation: 0,
                            minRotation: 0,
                            stepSize: 100
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Cost (USD)',
                            fontColor: "#ffffff",
                            fontSize: 20
                        }
                    }], yAxes: [{
                        gridLines:{
                            display: false
                        },
                        ticks: {
                            fontColor: "#ffffff",
                            fontSize: 16,
                            padding: 30
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Neighborhood',
                            fontColor: "#ffffff",
                            fontSize: 20
                        }
                    }]
                }
            }
        });
    });

    $.getJSON('api/ratings').done(function(data) {
        var dataset = [], labels = [], cost = 0, count = 0;

        for(var i = 0; i < data.length; i++) {
            labels.push(data[i].key);
            dataset.push((1.0 * data[i].val.score) / data[i].val.count);

            count += data[i].val.count;
            cost += data[i].val.price;
        }

        var propertyTypeChart2 = new Chart("neighborhood_ratings", {
            type: 'horizontalBar',
            data: {
                datasets: [{'data': dataset, backgroundColor: colors[5]}],
                labels: labels
            },
            options: {
                title: {
                    text: 'Average rating per neighborhood'
                },
                scales: {
                    xAxes: [{
                        gridLines:{
                            display: false
                        },
                        ticks: {
                            fontColor: "#ffffff",
                            fontSize: 20,
                            maxRotation: 0,
                            minRotation: 0
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Rating',
                            fontColor: "#ffffff",
                            fontSize: 20
                        }, categoryPercentage: 1.0
                    }], yAxes: [{
                        gridLines:{
                            display: false
                        },
                        ticks: {
                            fontColor: "#ffffff",
                            fontSize: 16,
                            padding: 30
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Neighborhood',
                            fontColor: "#ffffff",
                            fontSize: 20
                        }
                    }]
                }
            }
        });
    });

    /** Event listener for text to switch the property charts */
    $('#prop-switch').on('click', function(evt) {
        if(mainChartVisible) {
            $("#prop_types").css('display', 'none');
            $("#prop_types2").css('display', 'block');
        } else {
            $("#prop_types").css('display', 'block');
            $("#prop_types2").css('display', 'none');
        }
        mainChartVisible = !mainChartVisible;
    });
});
