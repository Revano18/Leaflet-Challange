// Create the 'basemap' tile layer that will be the background of our map (OpenStreetMap)
let basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Create the 'Satellite' tile layer (using ESRI for satellite imagery)
let satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: '&copy; <a href="https://www.esri.com/">ESRI</a>'
});

// Create the 'Greyscale' tile layer (using Stamen for greyscale map style)
let greyscaleLayer = L.tileLayer('https://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://stamen.com/">Stamen Design</a>'
});

// Create the 'Outdoor' tile layer (Stamen's "Toner" for outdoor theme)
let outdoorLayer = L.tileLayer('https://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.jpg', {
  attribution: '&copy; <a href="https://stamen.com/">Stamen Design</a>'
});

// Create the map object with center and zoom options.
let map = L.map("map", {
  center: [-8.4095, 115.1889], 
  zoom: 5,
  layers: [basemap] 
})

// Define base maps (for the layer control)
let baseMaps = {
  "Basemap (OSM)": basemap,
  "Satellite": satelliteLayer,
  "Greyscale": greyscaleLayer,
  "Outdoor": outdoorLayer
};

// Create overlay maps (for the tectonic plates layer and earthquake bubbles)
let overlayMaps = {};

// Tectonic Plates Layer (using the GeoJSON data)
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function (plate_data) {
  // Save the geoJSON data, along with style information, to the tectonic_plates layer
  let tectonic_plates = L.geoJson(plate_data, {
    style: {
      color: "orange",
      weight: 2,
      opacity: 1
    }
  });

  // Add the tectonic_plates layer to the overlayMaps object so it can be toggled
  overlayMaps["Tectonic Plates"] = tectonic_plates;

  // Optional: Add earthquake markers (your original earthquake data request)
  d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function (data) {
  
    // Function to style each earthquake's circle marker (bubbles)
    function styleInfo(feature) {
      return {
        radius: getRadius(feature.properties.mag),
        fillColor: getColor(feature.geometry.coordinates[2]),
        color: "#000000",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0.8
      };
    }

    // Function to determine color based on depth
    function getColor(depth) {
      if (depth < 10) {
        return "#00FF00"; // Green
      } else if (depth < 30) {
        return "#FFFF00"; // Yellow
      } else if (depth < 50) {
        return "#FF7F00"; // Orange
      } else {
        return "#FF0000"; // Red
      }
    }

    // Function to determine radius based on magnitude
    function getRadius(magnitude) {
      return magnitude === 0 ? 1 : magnitude * 4;
    }

    // Earthquake markers (bubbles) layer
    let earthquakeLayer = L.geoJson(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng);
      },
      style: styleInfo,
      onEachFeature: function (feature, layer) {
        layer.bindPopup(
          "<h3>Magnitude: " + feature.properties.mag + "</h3>" +
          "<h3>Location: " + feature.properties.place + "</h3>" +
          "<h3>Depth: " + feature.geometry.coordinates[2] + " km</h3>"
        );
      }
    });

    // Add the earthquake layer to the overlayMaps object so it can be toggled
    overlayMaps["Earthquakes"] = earthquakeLayer;

    // Add the layer control to the map, including both base and overlay layers
    L.control.layers(baseMaps, overlayMaps).addTo(map);

    // Create and add legend
    let legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
      let div = L.DomUtil.create("div", "info legend");
      let depths = [0, 10, 30, 50];
      let colors = ["#00FF00", "#FFFF00", "#FF7F00", "#FF0000"];

      div.innerHTML = '<h4>Earthquake Depth</h4>';

      for (let i = 0; i < depths.length; i++) {
        div.innerHTML +=
          '<i style="background:' + colors[i] + '"></i> ' +
          depths[i] + (depths[i + 1] ? '&ndash;' + depths[i + 1] + ' km<br>' : '+ km');
      }

      return div;
    };

    legend.addTo(map);
  });
});
