module.exports = [
  {
    title: 'Streets',
    style: 'mapbox://styles/mapbox/streets-v11',
  },
  {
    title: 'Satellite Streets',
    style: 'mapbox://styles/mapbox/satellite-streets-v11',
  },
  {
    title: 'Outdoors',
    style: 'mapbox://styles/mapbox/outdoors-v11',
  },
  {
    title: 'Light',
    style: 'mapbox://styles/mapbox/light-v10',
  },
  {
    title: 'Dark',
    style: 'mapbox://styles/mapbox/dark-v10',
  },
  {
    title: 'OSM',
    style: {
      name: 'osm',
      version: 8,
      sources: {
        'osm-raster-tiles': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
        }
      }, 
      layers: [
        {
          id: 'osm-raster-layer',
          type: 'raster',
          source: 'osm-raster-tiles',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    },
  },
];