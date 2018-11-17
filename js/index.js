mapboxgl.accessToken =
 "pk.eyJ1IjoiYnVkZHliIiwiYSI6ImtseXhGOTQifQ.f2aqgCg7-rXrhy5FxYcLSw";

// Application parameters
var dev = false;
var scaleFactor = dev ? .1 : 1;
var newYorkStops = [
  { coordinates: [-73.95809412002563, 40.78471909639683],
      steps: 0,
      name: "Cooper Hewitt"},
  { coordinates: [-73.96043300628662, 40.78155693112764],
    steps: 4000  * scaleFactor,
    name: "5th Ave and 86th St"},
  { coordinates: [-73.95551919937134, 40.77946904778007],
    steps: 2000  * scaleFactor,
    name: "Lexington Ave and 86th St"},
  { coordinates: [-73.95090579986572, 40.785886845761574],
    steps: 4000  * scaleFactor,
    name: "Lexington Ave and 96th St"},
  { coordinates: [-73.95578742027283, 40.78790141900539],
    steps: 2000  * scaleFactor,
    name: "5th Ave and 96th St"},
  { coordinates: [-73.9581048488617, 40.78472518905549],
    steps: 2000  * scaleFactor,
    name: "Cooper Hewitt"}
];

var rawRouteObject =
  {
    type     : "FeatureCollection",
    features : [
      {
        type     : "Feature",
        geometry : {
          type    : "LineString",
          coordinates: null
        }
      }
    ]
  }


var stepsA = 400;
var stepsB = 300;

var map = new mapboxgl.Map({
 container : "map",
 style     : "mapbox://styles/mapbox/streets-v9",
 center    : [-73.958075, 40.784718],
 zoom      : 16
});

var olli = {
 type     : "FeatureCollection",
 features : [
  {
   type         : "Feature",
   properties   : {},
   geometry     : {
    type        : "Point",
    coordinates : [-73.958075, 40.78472]
   } 
  }
 ]
};

//var route = JSON.parse(JSON.stringify(rawRouteObject));
//route.features[0].geometry.coordinates = [newYorkCoordinates[0], newYorkCoordinates[1]];

var route = [];

for (var i = 0; i < (newYorkStops.length-1); i++) {
  route[i] = JSON.parse(JSON.stringify(rawRouteObject));
  route[i].features[0].geometry.coordinates = [newYorkStops[i].coordinates, newYorkStops[i+1].coordinates];
}


var lineDistance, currentRoute;
for (var i = 0; i < route.length; i++) {
  //console.log("Route features: ", route[i].features[0].geometry.coordinates);
  lineDistance = turf.lineDistance(route[i].features[0], "kilometers");
  currentRoute = route[i];
  for (var s = 0; s < lineDistance; s+= lineDistance/ newYorkStops[i+1].steps) {
    var segment = turf.along(currentRoute.features[0], s, "kilometers");
    currentRoute.features[0].geometry.coordinates.push(segment.geometry.coordinates);
  }
  //console.log("Current Route: ", currentRoute.features[0].geometry.coordinates);
  route[i] = currentRoute

}

// Update the route with calculated arc coordinates

map.on("load", function() {

//Add 3D Dimensional 
  var layers = map.getStyle().layers;

    var labelLayerId;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
        }
    }

    map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#aaa',

            // use an 'interpolate' expression to add a smooth transition effect to the
            // buildings as the user zooms in
            'fill-extrusion-height': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "height"]
            ],
            'fill-extrusion-base': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "min_height"]
            ],
            'fill-extrusion-opacity': .6
        }
    }, labelLayerId);

// End of 3D Dimensional addition

  map.addSource('point', {
    "type": "geojson",
    "data": olli
  });

  for (var i = 0; i < route.length; i++) {
    map.addSource('route-'+i, {
      "type": "geojson",
      "data": route[i]
    });
  }


  for (var i = 0; i < route.length; i++) {
    map.addLayer({
      "id": "route-"+i,
      "source": "route-"+i,
      "type": "line",
      "paint": {
        "line-width": 2,
        "line-color": "#007cbf"
      }
    });
  }


  map.loadImage(
  "https://raw.githubusercontent.com/ibm-watson-data-lab/olli-simple-map/master/www/olli-icon.png",
  function(error, image) {
   if (error) throw error;
   map.addImage("olliimg", image);

   map.addLayer({
    id     : "olli",
    type   : "symbol",
    source : {
     type : "geojson",
     data : {
      type     : "FeatureCollection",
      features : [
       {
        type     : "Feature",
        geometry : {
         type        : "Point",
         coordinates : [-73.958075, 40.784718]
        }
       }
      ]
     }
    },
    layout: {
     "icon-image" : "olliimg",
     "icon-size"  : 0.75
    }
   });
  }
 );

  var counter = 0;
  var stopIndex = 0;
  var steps;
 function animate() { // Update point geometry to a new position based on counter denoting
  // the index to access the arc.
  olli.features[0].geometry.coordinates = route[stopIndex].features[0].geometry.coordinates[counter];

  // Update the source with this new data.
  map.getSource('olli').setData(olli);

  map.flyTo({center: olli.features[0].geometry.coordinates});

  steps = newYorkStops[stopIndex+1].steps;
  console.log("Steps: ", steps);
  // Request the next frame of animation so long the end has not been reached.
   if (counter < steps) {
     console.log("animating! Counter at: ", counter);
     console.log("Stop Index: ", stopIndex);
     console.log("route length: ", route.length);
     counter = counter + 1;
     requestAnimationFrame(animate);
   } else if (steps<= counter ) {
     if (stopIndex+1 === route.length){
       console.log("Route complete!")
     } else {
       console.log("moving to next stop!");
       // Update side bar / pop data for next stop
       updateData(stopIndex + 2);
       stopIndex += 1;
       counter = 0;
       animate();
     }



   }

}
 document.getElementById("replay").addEventListener("click", function() {
   console.log("click!");
  animate(0);


 });

  function updateData(stopIndex) {
    document.getElementById("title").innerHTML = "Next Stop: " + newYorkStops[stopIndex].name;


// Ticker 
    var width = $('.ticker-text').width(),
    containerwidth = $('.ticker-container').width(),
    left = containerwidth;
$(document).ready(function(e){
  function tick() {
        if(--left < -width){
            left = containerwidth;
        }
        $(".ticker-text").css("margin-left", left + "px");
        setTimeout(tick, 8);
      }
      tick();
});var width = $('.ticker-text').width(),
    containerwidth = $('.ticker-container').width(),
    left = containerwidth;
$(document).ready(function(e){
  function tick() {
        if(--left < -width){
            left = containerwidth;
        }
        $(".ticker-text").css("margin-left", left + "px");
        setTimeout(tick, 8);
      }
      tick();
});
  }
 // Start the animation.
 animate(0);
});


// Ticker
