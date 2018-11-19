mapboxgl.accessToken =
 "pk.eyJ1IjoiYnVkZHliIiwiYSI6ImtseXhGOTQifQ.f2aqgCg7-rXrhy5FxYcLSw";


//Upper Right Hand Top Panel 
 $('.panel-collapse').on('show.bs.collapse', function () {
    $(this).siblings('.panel-heading').addClass('active');
  });

  $('.panel-collapse').on('hide.bs.collapse', function () {
    $(this).siblings('.panel-heading').removeClass('active');
  });

// Application parameters
var dev = false;
var scaleFactor = dev ? .1 : 1;
var newYorkStops = [
  { coordinates: [-73.95809412002563, 40.78471909639683],
      steps: 0,
      name: "Cooper Hewitt",
      info: "Cooper Hewitt is America’s design museum. Inclusive, innovative, and experimental, the museum’s dynamic exhibitions, education programs, master’s program, publications, and online resources inspire, educate, and empower people through design.",
      waitDuration: null},
  { coordinates: [-73.962302, 40.778961],
    steps: 4000  * scaleFactor,
    name: "Metropolitan Museum of Art",
    info: "The Metropolitan Museum of Art, the Met, has a variety of services and exciting programs that are tailored to meet the needs of visitors with disabilities.",
    waitDuration: 1000 * scaleFactor},
  { coordinates: [-73.955870, 40.776272],
    steps: 2500  * scaleFactor,
    name: "3rd and 86th - Transfer to 4, 5, 6, and Q",
    info: "Only the 86th St and Second Ave Subway station with access to the Q is wheelchair is accessible. The elevator is on the southeast corner of 86th Street and 2nd Avenue.",
    waitDuration: 0},
  { coordinates: [-73.953971, 40.778741],
    steps: 2500  * scaleFactor,
    name: "3rd and 86th - Transfer to 4, 5, 6, and Q",
    info: "Only the 86th St and Second Ave Subway station with access to the Q is wheelchair is accessible. The elevator is on the southeast corner of 86th Street and 2nd Avenue.",
    waitDuration: 0},
  { coordinates: [-73.944783, 40.774948],
    steps: 2500  * scaleFactor,
    name: "Carl Schurz Park",
    info: "Wheelchair access is available at the East 84th and East 87th Street entrances and along the John Finley Walk. Gracie Mansion is wheelchair accessible",
    waitDuration: 1000 * scaleFactor},
  { coordinates: [-73.943386, 40.776909],
    steps: 2000  * scaleFactor,
    name: "Cooper Hewitt Museum",
    info: "Cooper Hewitt is America’s design museum. Inclusive, innovative, and experimental, the museum’s dynamic exhibitions, education programs, master’s program, publications, and online resources inspire, educate, and empower people through design. For info about accessibility visit https://www.cooperhewitt.org/accessibility-at-cooper-hewitt/",
    waitDuration: 0},
  { coordinates: [-73.955672, 40.782072],
    steps: 2000  * scaleFactor,
    name: "Cooper Hewitt Museum",
    info: "Cooper Hewitt is America’s design museum. Inclusive, innovative, and experimental, the museum’s dynamic exhibitions, education programs, master’s program, publications, and online resources inspire, educate, and empower people through design. For info about accessibility visit https://www.cooperhewitt.org/accessibility-at-cooper-hewitt/",
    waitDuration: 0},
  { coordinates: [-73.954786, 40.783330],
    steps: 2000  * scaleFactor,
    name: "Cooper Hewitt Museum",
    info: "Cooper Hewitt is America’s design museum. Inclusive, innovative, and experimental, the museum’s dynamic exhibitions, education programs, master’s program, publications, and online resources inspire, educate, and empower people through design. For info about accessibility visit https://www.cooperhewitt.org/accessibility-at-cooper-hewitt/",
    waitDuration: 0},
  { coordinates: [-73.9581048488617, 40.78472518905549],
    steps: 2500  * scaleFactor,
    name: "Cooper Hewitt Museum",
    info: "Cooper Hewitt is America’s design museum. Inclusive, innovative, and experimental, the museum’s dynamic exhibitions, education programs, master’s program, publications, and online resources inspire, educate, and empower people through design. For info about accessibility visit https://www.cooperhewitt.org/accessibility-at-cooper-hewitt/",
    waitDuration: 1000 * scaleFactor}
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
 zoom      : 14
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
        "line-width": 3,
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
  var waitDurationCounter = 0;
  var stopIndex = 0;
  var steps, currentStop;
 function animate() { // Update point geometry to a new position based on counter denoting
  // the index to access the arc.
   currentStop = newYorkStops[stopIndex+1];
  olli.features[0].geometry.coordinates = route[stopIndex].features[0].geometry.coordinates[counter];

  // Update the source with this new data.
  map.getSource('olli').setData(olli);

  map.flyTo({center: olli.features[0].geometry.coordinates,
            zoom: 16});

  steps = newYorkStops[stopIndex+1].steps;
  if (dev) {console.log("Steps: ", steps);}
  // Request the next frame of animation so long the end has not been reached.
   if (counter < steps) {
     if (dev) {
       console.log("animating! Counter at: ", counter);
       console.log("Stop Index: ", stopIndex);
       console.log("route length: ", route.length);
     }
     counter = counter + 1;
     requestAnimationFrame(animate);
   } else if (steps<= counter ) {
     if (stopIndex+1 === route.length){
       if (dev) {console.log("Route complete!");}
     } else {
       if (dev) {
         console.log("Arrived at next stop!");
         console.log("Wait Duration: ", currentStop.waitDuration, "\n waitDurationCoutner: ", waitDurationCounter);}

       // Check for wait time at stop
       if (currentStop.waitDuration && waitDurationCounter < currentStop.waitDuration) {
         console.log("Animating wait frame");
          map.flyTo({
        // These options control the ending camera position: centered at
        // the target, at zoom level 9, and north up.
        zoom: 14});

           waitDurationCounter += 1;
           requestAnimationFrame(animate);
       } else {
         if (dev) {
           console.log("moving to next stop!");
         }
         // Update side bar / pop data for next stop
         updateData(stopIndex + 2);
         stopIndex += 1;
         counter = 0;
         waitDurationCounter = 0;
         animate();
       }
     }
   }
}
 document.getElementById("replay").addEventListener("click", function() {
   stopIndex = 0;
   counter = 0;
   if (dev) {console.log("click!");}
  animate(0);


 });

  function updateData(stopIndex) {
    document.getElementById("title").innerHTML = "Next Stop: " + newYorkStops[stopIndex].name;
    document.getElementById("info").innerHTML = newYorkStops[stopIndex].info;


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


