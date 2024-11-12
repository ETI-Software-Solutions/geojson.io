const mapboxgl = require('mapbox-gl');
const escape = require('escape-html');
const length = require('@turf/length').default;
const area = require('@turf/area').default;

const popup = require('../../lib/popup');
const ClickableMarker = require('./clickable_marker');
const zoomextent = require('../../lib/zoomextent');
const {
  DEFAULT_DARK_FEATURE_COLOR,
  DEFAULT_LIGHT_FEATURE_COLOR,
  DEFAULT_SATELLITE_FEATURE_COLOR
} = require('../../constants');

const markers = [];

makiNames = require('@mapbox/maki/layouts/all.json');
let makiOptions = '';

for (let i = 0; i < makiNames.length; i++) {
  makiOptions += '<option value="' + makiNames[i] + '">';
}

const addIds = (geojson) => {
  return {
    ...geojson,
    features: geojson.features.map((feature, i) => {
      return {
        ...feature,
        id: i
      };
    })
  };
};

const addMarkers = (geojson, context, writable) => {
  // remove all existing markers
  markers.forEach((d) => {
    d.remove();
  });
  const pointFeatures = [];

  // wrap point geometry in a feature and push
  const handlePointGeometry = (geometry, properties, id) => {
    pointFeatures.push({
      type: 'Feature',
      id,
      geometry,
      properties
    });
  };

  // the three geometry types that may need markers are Point, MultiPoint, or GeometryCollection
  // for each point to be rendered, create a separate feature with the parent's properties
  // so that they will show up properly in the popup
  // TODO: indicate in the popup and/or elsewhere when a point is part of a MultiPoint or GeometryCollection
  const handleGeometry = (geometry, properties, index) => {
    if (geometry.type === 'Point') {
      handlePointGeometry(geometry, properties, index);
    }

    if (geometry.type === 'MultiPoint') {
      geometry.coordinates.forEach((coordinatePair) => {
        handlePointGeometry(
          {
            type: 'Point',
            coordinates: coordinatePair
          },
          properties || {},
          index
        );
      });
    }

    if (geometry.type === 'GeometryCollection') {
      geometry.geometries.forEach((geometry) => {
        handleGeometry(geometry, properties, index);
      });
    }
  };

  geojson.features.forEach((d, i) => {
    const { geometry, properties } = d;
    handleGeometry(geometry, properties, i);
  });

  if (pointFeatures.length === 0) {
    return;
  }

  pointFeatures.map((d) => {
    let defaultColor = DEFAULT_DARK_FEATURE_COLOR; // Default feature color
    let defaultSymbolColor = '#fff';

    const activeStyle = context.storage.get('style');

    // Adjust the feature color for certain styles to help visibility
    switch (activeStyle) {
      case 'Satellite Streets':
        defaultColor = DEFAULT_SATELLITE_FEATURE_COLOR;
        defaultSymbolColor = '#fff';
        break;
      case 'Dark':
        defaultColor = DEFAULT_LIGHT_FEATURE_COLOR;
        defaultSymbolColor = DEFAULT_DARK_FEATURE_COLOR;
        break;
      default:
        defaultColor = DEFAULT_DARK_FEATURE_COLOR;
        defaultSymbolColor = '#fff';
    }

    // If the Feature Object contains styling then use that, otherwise use our default feature color.
    const color =
      (d.properties && d.properties['marker-color']) || defaultColor;
    const symbolColor =
      (d.properties && d.properties['symbol-color']) || defaultSymbolColor;

    let scale = 1;
    if (d.properties && d.properties['marker-size']) {
      if (d.properties['marker-size'] === 'small') {
        scale = 0.6;
      }

      if (d.properties['marker-size'] === 'large') {
        scale = 1.2;
      }
    }

    let symbol;
    if (d.properties && d.properties['marker-symbol'] !== undefined) {
      symbol = d.properties['marker-symbol'];
    }

    const marker = new ClickableMarker({
      color,
      scale,
      symbol,
      symbolColor
    })
      .setLngLat(d.geometry.coordinates)
      .onClick(() => {
        bindPopup(
          {
            lngLat: d.geometry.coordinates,
            features: [d]
          },
          context,
          writable
        );
      })
      .addTo(context.map);

    marker.getElement().addEventListener('touchstart', () => {
      bindPopup(
        {
          lngLat: d.geometry.coordinates,
          features: [d]
        },
        context,
        writable
      );
    });

    // Update the dot in the Marker for Dark base map style
    if (activeStyle === 'Dark')
      d3.selectAll('.mapboxgl-marker svg circle').style(
        'fill',
        '#555',
        'important'
      );

    markers.push(marker);
  });
};

function geojsonToLayer(context, writable) {
  const geojson = context.data.get('map');
  if (!geojson) return;

  const workingDatasetSource = context.map.getSource('map-data');

  if (workingDatasetSource) {
    const filteredFeatures = geojson.features.filter(
      (feature) => feature.geometry
    );
    const filteredGeojson = {
      type: 'FeatureCollection',
      features: filteredFeatures
    };
    workingDatasetSource.setData(addIds(filteredGeojson));
    addMarkers(filteredGeojson, context, writable);
    if (context.data.get('recovery')) {
      zoomextent(context);
      context.data.set({
        recovery: false
      });
    }
  }
}

function selectDevices(asset_array){
  setTimeout(() => {
    const deviceSelect = document.getElementById('devices');
    const deviceTableElement = document.getElementById('deviceTable'); // Get the deviceTable element
  
    deviceSelect.addEventListener('change', function () {
      const selectedValue = deviceSelect.value;
  
      // Check if an option was selected
      if (selectedValue) {
        // Find the selected device object from asset_array
        const selectedDevice = asset_array.find(item => item.device_id == selectedValue);
  
        // Update the deviceTable HTML content
        let newTableContent = '<table class="metadata" id="deviceTable">';
        if (selectedDevice) {
          Object.entries(selectedDevice).forEach(([key, value]) => {
            const safeValue = value
              ? value.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;')
              : ''; // Sanitize value
              if (safeValue.startsWith("http://") || safeValue.startsWith("https://")){
                newTableContent += `<tr><td colspan="2"><a href="${safeValue}" target="_blank">${key}</a></td></tr>`
              } else {
                newTableContent += `<tr><td>${key}</td><td>${safeValue}</td></tr>`;
              }
          });
        }
        newTableContent += '</table>';
  
        // Replace deviceTable content with the new content
        deviceTableElement.innerHTML = newTableContent;
      } else {
        deviceTableElement.innerHTML = '<table class="metadata"><tr><td colspan="2">No device selected</td></tr></table>';
      }
    });
  }, 0);
}

function selectPhones(asset_array){
  setTimeout(() => {
    const phoneSelect = document.getElementById('phones');
    const phoneTableElement = document.getElementById('phoneTable'); // Get the phoneTable element
  
    phoneSelect.addEventListener('change', function () {
      const selectedValue = phoneSelect.value;
  
      // Check if an option was selected
      if (selectedValue) {
        // Find the selected phone object from asset_array
        const selectedphone = asset_array.find(item => item.directory_num == selectedValue);
  
        // Update the phoneTable HTML content
        let newTableContent = '<table class="metadata" id="phoneTable">';
        if (selectedphone) {
          Object.entries(selectedphone).forEach(([key, value]) => {
            const safeValue = value
              ? value.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;')
              : ''; // Sanitize value
              if (safeValue.startsWith("http://") || safeValue.startsWith("https://")){
                newTableContent += `<tr><td colspan="2"><a href="${safeValue}" target="_blank">${key}</a></td></tr>`
              } else {
                newTableContent += `<tr><td>${key}</td><td>${safeValue}</td></tr>`;
              }
          });
        }
        newTableContent += '</table>';
  
        // Replace phoneTable content with the new content
        phoneTableElement.innerHTML = newTableContent;
      } else {
        phoneTableElement.innerHTML = '<table class="metadata"><tr><td colspan="2">No phone selected</td></tr></table>';
      }
    });
  }, 0);
}

function selectServices(asset_array){
  setTimeout(() => {
    const serviceSelect = document.getElementById('services');
    const serviceTableElement = document.getElementById('serviceTable'); // Get the serviceTable element
  
    serviceSelect.addEventListener('change', function () {
      const selectedValue = serviceSelect.value;
  
      // Check if an option was selected
      if (selectedValue) {
        // Find the selected service object from asset_array
        const selectedservice = asset_array.find(item => item.service_name == selectedValue);
  
        // Update the serviceTable HTML content
        let newTableContent = '<table class="metadata" id="serviceTable">';
        if (selectedservice) {
          Object.entries(selectedservice).forEach(([key, value]) => {
            const safeValue = value
              ? value.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;')
              : ''; // Sanitize value  

            if (safeValue.startsWith("http://") || safeValue.startsWith("https://")){
              newTableContent += `<tr><td colspan="2"><a href="${safeValue}" target="_blank">${key}</a></td></tr>`
            } else {
              newTableContent += `<tr><td>${key}</td><td>${safeValue}</td></tr>`;
            }
          });
        }
        newTableContent += '</table>';
  
        // Replace serviceTable content with the new content
        serviceTableElement.innerHTML = newTableContent;
      } else {
        serviceTableElement.innerHTML = '<table class="metadata"><tr><td colspan="2">No service selected</td></tr></table>';
      }
    });
  }, 0);
}

function bindPopup(e, context, writable) {
  // build the popup using the actual feature from the data store,
  // not the feature returned from queryRenderedFeatures()
  const { id } = e.features[0];
  const feature = context.data.get('map').features[id];

  // the id is needed when clicking buttons in the popup, but only exists on the feature after it is added to the map
  feature.id = id;

  const props = feature.properties;
  let table = '';
  let info = '';
  let deviceAsset = '';
  let phoneAsset = '';
  let serviceAsset = '';
  let deviceTable = '';
  let phoneTable = '';
  let serviceTable = '';
  let edit_link = '';

  let properties = {};

  // Steer clear of XSS
  for (const k in props) {
    const esc = escape(k);
    // users don't want to see "[object Object]"
    if (typeof props[k] === 'object') {
      properties[esc] = escape(JSON.stringify(props[k]));
    } else {
      properties[esc] = escape(props[k]);
    }
  }

  if (!properties) return;

  if (!Object.keys(properties).length) properties = { '': '' };

  for (const key in properties) {
    if (
      (key === 'marker-color' || key === 'stroke' || key === 'fill') &&
      writable
    ) {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></th>' +
        '<td><input type="color" value="' +
        properties[key] +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></td></tr>';
    } else if (key === 'marker-size' && writable) {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></th>' +
        '<td><input type="text" list="marker-size" value="' +
        properties[key] +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /><datalist id="marker-size"><option value="small"><option value="medium"><option value="large"></datalist></td></tr>';
    } else if (key === 'marker-symbol' && writable) {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></th>' +
        '<td><input type="text" list="marker-symbol" value="' +
        properties[key] +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /><datalist id="marker-symbol">' +
        makiOptions +
        '</datalist></td></tr>';
    } else if (key === 'stroke-width' && writable) {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></th>' +
        '<td><input type="number" min="0" step="0.1" value="' +
        properties[key] +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></td></tr>';
    } else if (['stroke-opacity', 'fill-opacity'].includes(key) && writable) {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></th>' +
        '<td><input type="number" min="0" max="1" step="0.1" value="' +
        properties[key] +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></td></tr>';
    } else {
  
      if(properties[key].startsWith("http://") || properties[key].startsWith("https://")) {
        
        // Link row
        //table += `<tr><td colspan="2"><a style="margin-left: 5px;" href="${properties[key]}" target="_blank">` +
        //key +
        //(!writable ? ' readonly' : '') +
        //'</a></td></tr>';
        edit_link = '<a style="margin-left: 5px;" href="' + properties[key] + '" target="_blank">' + key + '</a>';

      } else if (properties[key].startsWith("[{") && properties[key].endsWith('}]')) {
        // List row 

        let asset_array = '';
        let decoded_array = properties[key].replace(/&quot;/g, '"');

        try {
          asset_array = JSON.parse(decoded_array);
        } catch (error) {
          console.error("Failed to parse JSON:", error);
        }


        if (key == "devices"){

          deviceAsset += '<label for="' + key + '" style="font-weight: bold;">Select ' + key + ':</label>' +
        '<select name="' + key + '" id="' + key + '">'

          for (let item of asset_array) {
            deviceAsset += '<option value="' + item.device_id + '">' + item.device_id + '</option>'
          }

          deviceAsset += '</select>'

          deviceTable += '<table class="metadata" id="deviceTable">';
          if (asset_array.length > 0) {
            Object.entries(asset_array[0]).forEach(([key, value]) => {
              const safeValue = value
                ? value.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;')
                : ''; // Sanitize value
              
                if (safeValue.startsWith("http://") || safeValue.startsWith("https://")){
                  deviceTable += `<tr><td colspan="2"><a href="${safeValue}" target="_blank">${key}</a></td></tr>`
                } else {
                  deviceTable += `<tr><td>${key}</td><td>${safeValue}</td></tr>`;
                }
            });
          }
          deviceTable += '</table>';

          selectDevices(asset_array);

        } else if(key == "phones"){

          phoneAsset += '<label for="' + key + '" style="font-weight: bold;">Select ' + key + ':</label>' +
        '<select name="' + key + '" id="' + key + '">'

          for (let item of asset_array) {
            phoneAsset += '<option value="' + item.directory_num + '">' + item.directory_num + '</option>'
          }

          phoneAsset += '</select>'

          phoneTable += '<table class="metadata" id="phoneTable">';
          if (asset_array.length > 0) {
            Object.entries(asset_array[0]).forEach(([key, value]) => {
              const safeValue = value
                ? value.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;')
                : ''; // Sanitize value
                
                if (safeValue.startsWith("http://") || safeValue.startsWith("https://")){
                  phoneTable += `<tr><td colspan="2"><a href="${safeValue}" target="_blank">${key}</a></td></tr>`
                } else {
                  phoneTable += `<tr><td>${key}</td><td>${safeValue}</td></tr>`;
                }
            });
          }
          phoneTable += '</table>';

          selectPhones(asset_array);

        } else if(key == "services"){

          serviceAsset += '<label for="' + key + '" style="font-weight: bold;">Select ' + key + ':</label>' +
        '<select name="' + key + '" id="' + key + '">'

          for (let item of asset_array) {
            serviceAsset += '<option value="' + item.service_name + '">' + item.service_name + '</option>'
          }

          serviceAsset += '</select>'

          serviceTable += '<table class="metadata" id="serviceTable">';
          if (asset_array.length > 0) {
            Object.entries(asset_array[0]).forEach(([key, value]) => {
              const safeValue = value
                ? value.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;')
                : ''; // Sanitize value

                if (safeValue.startsWith("http://") || safeValue.startsWith("https://")){
                  serviceTable += `<tr><td colspan="2"><a href="${safeValue}" target="_blank">${key}</a></td></tr>`
                } else {
                  serviceTable += `<tr><td>${key}</td><td>${safeValue}</td></tr>`;
                }
            });
          }
          serviceTable += '</table>';

          selectServices(asset_array);
        }

      } else if (key.startsWith("header_info")) {
        
        // Header row
        table += '<tr><td colspan="2" style="font-weight: bold;"><input type="text" value="' +
        properties[key] +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></tr>';

      } else {

        // Normal text row
        table += '<tr><th><input type="text" value="' +
        key +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></th>'

        table += '<td><input type="text" value="' +
        properties[key] +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></td></tr>';
      }
    }
  }

  if (feature && feature.geometry) {
    info += '<table class="metadata">';
    if (feature.geometry.type === 'LineString') {
      const total = length(feature) * 1000;
      info +=
        '<tr><td>Meters</td><td>' +
        total.toFixed(2) +
        '</td></tr>' +
        '<tr><td>Kilometers</td><td>' +
        (total / 1000).toFixed(2) +
        '</td></tr>' +
        '<tr><td>Feet</td><td>' +
        (total / 0.3048).toFixed(2) +
        '</td></tr>' +
        '<tr><td>Yards</td><td>' +
        (total / 0.9144).toFixed(2) +
        '</td></tr>' +
        '<tr><td>Miles</td><td>' +
        (total / 1609.34).toFixed(2) +
        '</td></tr>';
    } else if (feature.geometry.type === 'Point') {
      info +=
        '<tr><td>Latitude </td><td>' +
        feature.geometry.coordinates[1].toFixed(4) +
        '</td></tr>' +
        '<tr><td>Longitude</td><td>' +
        feature.geometry.coordinates[0].toFixed(4) +
        '</td></tr>';
    } else if (feature.geometry.type === 'Polygon') {
      info +=
        '<tr><td>Sq. Meters</td><td>' +
        area(feature.geometry).toFixed(2) +
        '</td></tr>' +
        '<tr><td>Sq. Kilometers</td><td>' +
        (area(feature.geometry) / 1000000).toFixed(2) +
        '</td></tr>' +
        '<tr><td>Sq. Feet</td><td>' +
        (area(feature.geometry) / 0.092903).toFixed(2) +
        '</td></tr>' +
        '<tr><td>Acres</td><td>' +
        (area(feature.geometry) / 4046.86).toFixed(2) +
        '</td></tr>' +
        '<tr><td>Sq. Miles</td><td>' +
        (area(feature.geometry) / 2589990).toFixed(2) +
        '</td></tr>';
    }
    info += '</table>';
  }

  // don't show the add simplestyle properties button if the feature already contains simplestyle properties
  let showAddStyleButton = true;

  if (
    feature.geometry.type === 'Point' ||
    feature.geometry.type === 'MultiPoint'
  ) {
    if ('marker-color' in properties && 'marker-size' in properties) {
      showAddStyleButton = false;
    }
  }

  if (
    feature.geometry.type === 'LineString' ||
    feature.geometry.type === 'MultiLineString'
  ) {
    if (
      'stroke' in properties &&
      'stroke-width' in properties &&
      'stroke-opacity' in properties
    ) {
      showAddStyleButton = false;
    }
  }

  if (
    feature.geometry.type === 'Polygon' ||
    feature.geometry.type === 'MultiPolygon'
  ) {
    showAddStyleButton = true;
    if (
      'stroke' in properties &&
      'stroke-width' in properties &&
      'stroke-opacity' in properties &&
      'fill' in properties &&
      'fill-opacity' in properties
    ) {
      showAddStyleButton = false;
    }
  }

  const tabs =
    '<div class="pad1 tabs-ui clearfix col12">' +
    '<div class="tab col12">' +
    '<input class="hide" type="radio" id="properties" name="tab-group" checked="true">' +
    '<label class="keyline-top keyline-right tab-toggle pad0 pin-bottomleft z10 center col6" for="properties">Properties</label>' +
    '<div class="space-bottom1 col12 content">' +
    '<table class="space-bottom0 marker-properties" id="asset_table">' +
    table +
    '</table>' +
    '<div>' +
    edit_link +
    ' </div>' +
    (writable
      ? '<div class="add-row-button add fl col4"><span class="fa-solid fa-plus"></span> Add row</div>'
      : '') +
    (writable && showAddStyleButton
      ? '<div class="add-simplestyle-properties-button fl text-right col8">Add simplestyle properties</div>'
      : '') +
    '<div>' +
    '<div style="margin-top: 5px; margin-bottom: 5px;">' +
    phoneAsset +
    ' </div>' +
    '<div style="height: 100px; overflow-x: auto; border: 1px solid grey;">' +
    phoneTable +
    ' </div>' +
    '</div>' +
    '<div>' +
    '<div style="margin-top: 5px; margin-bottom: 5px;">' +
    deviceAsset +
    ' </div>' +
    '<div style="height: 100px; overflow-x: auto; border: 1px solid grey;">' +
    deviceTable +
    ' </div>' +
    '</div>' +
    '<div>' +
    '<div style="margin-top: 5px; margin-bottom: 5px;">' +
    serviceAsset +
    ' </div>' +
    '<div style="height: 100px; overflow-x: auto; border: 1px solid grey;">' +
    serviceTable +
    ' </div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="space-bottom2 tab col12">' +
    '<input class="hide" type="radio" id="info" name="tab-group">' +
    '<label class="keyline-top tab-toggle pad0 pin-bottomright z10 center col6" for="info">Info</label>' +
    '<div class="space-bottom1 col12 content">' +
    '<div class="marker-info">' +
    info +
    ' </div>' +
    '</div>' +
    '</div>' +
    '</div>';

  const content =
    '<form action="javascript:void(0);">' +
    tabs +
    (writable
      ? '<div class="clearfix col12 pad1 keyline-top">' +
        '<div class="pill col6">' +
        '<button class="save col6 major" type="submit">Save</button>' +
        '<button class="minor col6 cancel">Cancel</button>' +
        '</div>' +
        '<button class="col6 text-right pad0 delete-invert"><span class="fa-solid fa-trash"></span> Delete feature</button></div>'
      : '') +
    '</form>';

  const popupOffsets = {
    top: [0, 10],
    'top-left': [0, 10],
    'top-right': [0, 10],
    bottom: [0, -40],
    'bottom-left': [0, -40],
    'bottom-right': [0, -40],
    left: [25, -20],
    right: [-25, -20]
  };

  new mapboxgl.Popup({
    closeButton: false,
    maxWidth: '251px',
    offset: popupOffsets,
    className: 'geojsonio-feature'
  })
    .setLngLat(e.lngLat)
    .setHTML(content)
    .on('open', (e) => {
      // bind popup event listeners
      popup(context)(e, feature.id);
    })
    .addTo(context.map);
}

module.exports = {
  addIds,
  addMarkers,
  geojsonToLayer,
  bindPopup
};
