
let myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 5
  });
  
  // Adding the tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(myMap);
  
// Use this link to get the GeoJSON data.
  let link = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";


function radiusCalc(magnitude) {

    // I want to really highlight big earthquakes and ignore tiny ones,
    // so I chose to square the magnitude
    let radiusMeters = (magnitude**2)
    return radiusMeters

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

    // creating 5 buckets of depth color based on the range
    factor = Math.floor(factor * 10) / 10

    // coloring based on depth. Least deep are red, most deep are yellow.
    let color = interpolateColor("rgb(255,255,0)","rgb(255,0,0)",factor)

    return color

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
            fillOpacity : .6,
                  color : depthColor(location.coordinates[2],minDepth,maxDepth),
                 weight : 0
        })
        
        newMarker.bindPopup(earthquake.properties.place + "<br> Magnitude: " + earthquake.properties.mag.toFixed(2) + "<br> Depth: " + location.coordinates[2].toFixed(2))

        newMarker.addTo(myMap);
      }

    }
  
  });

