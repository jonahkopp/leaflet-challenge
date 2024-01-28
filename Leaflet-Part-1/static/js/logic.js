
let myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 12
  });
  
  // Adding the tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(myMap);
  
// Use this link to get the GeoJSON data.
  let link = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";


// Getting our GeoJSON data
d3.json(link).then(function(response) {

    //console.log(response);
    features = response.features;
  
    //console.log(features);
  
    for (let i = 0; i < features.length; i++) {
  
      let location = features[i].geometry;
      if(location){
        L.marker([location.coordinates[1], location.coordinates[0]]).addTo(myMap);
      }
    
    }
  
  });

