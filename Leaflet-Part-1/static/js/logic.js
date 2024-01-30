
let myMap = L.map("map", {
    center: [36.7783, -105.4179],
    zoom: 5
  });
  
  // Adding the tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);
  
// let info = L.control({
// position: "bottomright"
// });

// Use this link to get the GeoJSON data.
let link = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

// I didn't want to manually define buckets, so I used a lot of scaling to make this work.
// This makes the color scale have higher resolution for more shallow earthquakes as
// most earthquakes in the continental US are quite shallow relative to the world.
let numBuckets = 8
let legendColorFactorAdjustment = 4


function radiusCalc(magnitude) {

    // I want to really highlight big earthquakes and ignore tiny ones,
    // so I chose to raise the magnitude to the 1.5 power
    if (magnitude >= 0) {
        let radius = (2*magnitude)**(1.5)
        return radius
    } else {
        return 0
    }

}

// via https://codepen.io/njmcode/pen/NWdYBy?editors=0010
// regex parse: https://stackoverflow.com/questions/10970958/get-a-color-component-from-an-rgb-string-in-javascript
function interpolateColor(color1, color2, factor) {


    color1 = color1.replace(/[^\d,]/g, '').split(',')
    color2 = color2.replace(/[^\d,]/g, '').split(',')
    color1 = color1.map(item => parseInt(item))
    color2 = color2.map(item => parseInt(item))

    var result = color1.slice()
    for (var i = 0; i < 3; i++) {

        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]))

    }

    result = `rgb(${result[0]},${result[1]},${result[2]})`

    return result

}

function depthColor(depthCoord,min,max) {

    let range = max - min
    let place = depthCoord - min
    let factor = place / range

    // remap the factor for higher resolution at low depths, as it seems most
    // continental US earthquakes are very shallow
    factor = factor**(1/legendColorFactorAdjustment)

    // coloring based on depth. Least deep are cyan, most deep are red.
    let color = interpolateColor("rgb(0,255,255)","rgb(255,0,0)",factor)

    return color

}

function getDepthBuckets(depthMin,depthMax,numBuckets) {

    let range = depthMax - depthMin
    let depthBuckets = []

    for (let i = 0; i < numBuckets; i++) {

        depthBuckets.push((depthMin+range*(((1/numBuckets)*i)**legendColorFactorAdjustment)).toFixed(2))
    
    }

    legendBuckets = []

    for (let i = 0; i < numBuckets-1; i++) {

        bucket = `${depthBuckets[i]} - ${depthBuckets[i+1]}`
        legendBuckets.push(bucket)
    
    }

    legendBuckets.push(`${depthBuckets[numBuckets-1]}+`)

    return [depthBuckets,legendBuckets]

}

// Getting our GeoJSON data
d3.json(link).then(function(response) {

    features = response.features;

    let depthCoords = []

    for (let i = 0; i < features.length; i++) {

        depthCoords.push(features[i].geometry.coordinates[2])
    
    }

    let minDepth = Math.floor(Math.min(...depthCoords))
    let maxDepth = Math.ceil(Math.max(...depthCoords))

    for (let i = 0; i < features.length; i++) {
        
      let earthquake = features[i]
    
      let location = earthquake.geometry;

      if(location){
        // Using circleMarkers rather than circle so that as you zoom in, the circles separate
        // and you can get each one's individual detail. I experimented with circles for awhile
        // but this seems better.
        newMarker = L.circleMarker([location.coordinates[1], location.coordinates[0]],{
                 radius : radiusCalc(earthquake.properties.mag),
            fillOpacity : .8,
              fillColor : depthColor(location.coordinates[2],minDepth,maxDepth,numBuckets),
                  color : "black",
                 weight : 1
        })
        
        newMarker.bindPopup(`<h3> ${earthquake.properties.place}` + "<h4> Magnitude: " + earthquake.properties.mag.toFixed(2) + "<br> Depth: " + location.coordinates[2].toFixed(2))

        newMarker.addTo(myMap);
      }

    }
  

    // Legend (some code used from https://gis.stackexchange.com/questions/133630/adding-leaflet-legend)
    var legend = L.control({position: 'bottomleft'});
    legend.onAdd = function () {

    var div = L.DomUtil.create('div', 'info legend');
    labels = ['<strong>Depth</strong>'],
    depthBuckets = getDepthBuckets(minDepth,maxDepth,numBuckets)

    for (var i = 0; i < depthBuckets[0].length; i++) {

        labels.push("<li style=\"background-color: " + depthColor(depthBuckets[0][i],minDepth,maxDepth,numBuckets) + "\"></li>" + (depthBuckets[1][i] ? depthBuckets[1][i] : '+'));

        }

        div.innerHTML = labels.join('<br>');
        
    return div;
    };
    legend.addTo(myMap);

});

