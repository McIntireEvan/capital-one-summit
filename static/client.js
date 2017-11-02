var map, heat, marker;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.775, lng: -122.434},
        zoom: 12,
        gestureHandling: 'cooperative'
    });

    map.addListener('click', evt => {
        if(marker) {
            marker.setMap(null);
        }
        marker = new google.maps.Marker({
            position: evt.latLng,
            map: map
        });
    })
}

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

$(document).ready(() => {
    $.getJSON('api/locations').done(function(data) {
        heatmap = new google.maps.visualization.HeatmapLayer({
            data: jsonToLatLng(data),
            map: map,
        });
    });

    $.getJSON('api/stats').done(function(data) {
        var dataset = [], dataset2 = [];
        var labels = [], labels2 = [];

        var countData = data['count']
        var otherVal = 0;
        for(var i = 0; i < countData.length; i++) {
            if(i < 2) {
                dataset.push(countData[i].val);
                labels.push(countData[i].key);
            } else {
                otherVal += countData[i].val;
            }
        }
        dataset.push(otherVal);
        labels.push("Other");

        for(var i = 0; i < countData.length; i++) {
            if(i > 2) {
                dataset2.push(countData[i].val);
                labels2.push(countData[i].key);
            }
        }

        var barChartOps = {
            legend: {
                display: false
            }, scales: {
                xAxes: [{
                    gridLines:{
                        display: false
                    },
                    ticks: {
                        fontColor: "#ffffff"
                    }
                }], yAxes: [{
                    gridLines:{
                        display: false
                    },
                    ticks: {
                        fontColor: "#ffffff"
                    }
                }]
            }
        }

        var propertyTypeChart = new Chart("prop_types", {
            type: 'horizontalBar',
            data: {
                datasets: [{'data': dataset, backgroundColor: [
                    '#F28181','#E99ACA','#A4C4F8'
                ]}],
                labels: labels,
            },
            options: barChartOpts
        });


        var propertyTypeChart2 = new Chart("prop_types2", {
            type: 'horizontalBar',
            data: {
                datasets: [{'data': dataset2, backgroundColor: [
                    '#F28181','#E99ACA','#A4C4F8','#4FE7EB','#81FBAF','#EDFE74', '#F28181','#E99ACA','#A4C4F8','#4FE7EB','#81FBAF','#EDFE74', '#F28181','#E99ACA','#A4C4F8','#4FE7EB','#81FBAF','#EDFE74', '#F28181','#E99ACA','#A4C4F8','#4FE7EB','#81FBAF','#EDFE74'
                ]}],
                labels: labels2,
            },
            options: barChartOpts
        });
    });
});