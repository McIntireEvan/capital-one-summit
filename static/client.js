var map;
var heat;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.775, lng: -122.434},
        zoom: 12
    });
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
    $.getJSON('api').done(function(data) {
        console.log(data);
        console.log(jsonToLatLng(data));
        heatmap = new google.maps.visualization.HeatmapLayer({
            data: jsonToLatLng(data),
            map: map,
        });
    })
});