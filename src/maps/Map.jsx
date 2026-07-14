import { useEffect, useState } from 'react'
import L from 'leaflet'
import {
  CircleMarker,
  GeoJSON,
  LayerGroup,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import airQualityData from '../data/air-quality.json'
import './Maps.css'

const WARSAW_CENTER = [52.2298, 21.0118]

const qualityLabels = {
  'bardzo dobry': 'Very good',
  'brak indeksu': 'No index',
  dobry: 'Good',
  umiarkowany: 'Moderate',
  dostateczny: 'Sufficient',
  zły: 'Poor',
  'bardzo zły': 'Very poor',
}

function toTreeGeoJson(treeData) {
  return {
    type: 'FeatureCollection',
    features: treeData.records.map(
      ([id, longitude, latitude, species, district, address, health]) => ({
        type: 'Feature',
        id,
        geometry: { type: 'Point', coordinates: [longitude, latitude] },
        properties: { species, district, address, health },
      }),
    ),
  }
}

const treeRenderer = L.canvas({ padding: 0.5 })

function getQualityColor(label = '') {
  const normalized = label.toLocaleLowerCase('pl')

  if (normalized.includes('bardzo zły')) return '#9f2f2f'
  if (normalized.includes('zły')) return '#d94731'
  if (normalized.includes('dostateczny')) return '#ef7137'
  if (normalized.includes('umiarkowany')) return '#e6a637'
  if (normalized.includes('bardzo dobry')) return '#23885a'
  if (normalized.includes('dobry')) return '#61a64d'

  return '#65736b'
}

function translateQuality(label = '') {
  return qualityLabels[label.toLocaleLowerCase('pl')] ?? label ?? 'Unknown'
}

function getPrimaryReading(readings) {
  return (
    readings.find(({ param_code: code }) => code === 'PM25' || code === 'PM2.5') ??
    readings.find(({ param_code: code }) => code === 'PM10') ??
    readings[0]
  )
}

function escapeHtml(value) {
  return String(value ?? 'Not recorded')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function makeTreeMarker(_feature, latlng) {
  return L.circleMarker(latlng, {
    renderer: treeRenderer,
    radius: 2.4,
    color: '#18683c',
    fillColor: '#35a45f',
    fillOpacity: 0.72,
    opacity: 0.45,
    weight: 0.6,
  })
}

function bindTreePopup(feature, layer) {
  const { species, district, address, health } = feature.properties

  layer.bindPopup(`
    <article class="map-popup">
      <p class="map-popup__eyebrow">Tree inventory</p>
      <strong>${escapeHtml(species)}</strong>
      <dl>
        <div><dt>District</dt><dd>${escapeHtml(district)}</dd></div>
        <div><dt>Location</dt><dd>${escapeHtml(address)}</dd></div>
        <div><dt>Health</dt><dd>${escapeHtml(health)}</dd></div>
      </dl>
    </article>
  `)
}

function RecenterMap({ position }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 0.8 })
    }
  }, [map, position])

  return null
}

function AirQualityStations() {
  return airQualityData.result.map((record) => {
    const reading = getPrimaryReading(record.data)
    const quality = reading?.ijp?.name ?? record.ijp?.name ?? 'Unknown'
    const color = getQualityColor(quality)

    return (
      <CircleMarker
        key={`${record.name}-${record.lat}-${record.lon}`}
        center={[record.lat, record.lon]}
        radius={9}
        pathOptions={{
          color: '#ffffff',
          fillColor: color,
          fillOpacity: 0.9,
          opacity: 0.95,
          weight: 2,
        }}
      >
        <Popup>
          <article className="map-popup">
            <p className="map-popup__eyebrow">Air-quality station</p>
            <strong>{record.name}</strong>
            <span className="quality-badge" style={{ backgroundColor: color }}>
              {translateQuality(quality)}
            </span>
            <dl>
              <div>
                <dt>{reading?.param_code ?? 'Reading'}</dt>
                <dd>
                  {reading ? `${reading.value.toFixed(1)} ${reading.unit}` : 'Not available'}
                </dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{record.address?.street ?? record.station}</dd>
              </div>
              <div>
                <dt>Measured</dt>
                <dd>{reading?.time ?? 'Not recorded'}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{record.data_source}</dd>
              </div>
            </dl>
          </article>
        </Popup>
      </CircleMarker>
    )
  })
}

function TreeInventory() {
  const [treeGeoJson, setTreeGeoJson] = useState(null)

  useEffect(() => {
    let isMounted = true

    import('../data/trees.json').then(({ default: data }) => {
      if (isMounted) {
        setTreeGeoJson(toTreeGeoJson(data))
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  if (!treeGeoJson) return null

  return (
    <GeoJSON
      data={treeGeoJson}
      pointToLayer={makeTreeMarker}
      onEachFeature={bindTreePopup}
    />
  )
}

function Map({ activeLayers, userPosition }) {
  return (
    <section id="map" className="map-shell" aria-label="Interactive map of Warsaw">
      <MapContainer
        center={WARSAW_CENTER}
        zoom={12}
        minZoom={10}
        maxZoom={19}
        preferCanvas
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {activeLayers.air && (
          <LayerGroup>
            <AirQualityStations />
          </LayerGroup>
        )}

        {activeLayers.trees && <TreeInventory />}

        {userPosition && (
          <CircleMarker
            center={userPosition}
            radius={9}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#17231d',
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>You are here</Popup>
          </CircleMarker>
        )}

        <RecenterMap position={userPosition} />
      </MapContainer>
    </section>
  )
}

export default Map
