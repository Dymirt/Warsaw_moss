import { useEffect } from 'react'
import {
  CircleMarker,
  LayerGroup,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
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

function getPrimaryReading(readings = []) {
  return (
    readings.find(({ param_code: code }) => code === 'PM25' || code === 'PM2.5') ??
    readings.find(({ param_code: code }) => code === 'PM10') ??
    readings[0]
  )
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

function FitRoute({ result }) {
  const map = useMap()

  useEffect(() => {
    const route = result?.routes.find(({ id }) => id === result.selectedRouteId)
    if (!route) return

    const size = map.getSize()
    const isMobile = size.x <= 720

    map.fitBounds(
      route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
      {
        paddingTopLeft: [32, isMobile ? 88 : 48],
        paddingBottomRight: [32, isMobile ? Math.round(size.y * 0.5) : 48],
        maxZoom: 16,
      },
    )
  }, [map, result])

  return null
}

function AirQualityStations({ stations }) {
  return stations.map((record) => {
    const reading = getPrimaryReading(record.data)
    const quality = reading?.ijp?.name ?? record.ijp?.name ?? 'Unknown'
    const color = getQualityColor(quality)
    const readingValue = Number(reading?.value)

    return (
      <CircleMarker
        key={record.id ?? `${record.name}-${record.lat}-${record.lon}`}
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
                  {Number.isFinite(readingValue)
                    ? `${readingValue.toFixed(1)} ${reading.unit}`
                    : 'Not available'}
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

function RouteLines({ result }) {
  if (!result) return null

  const orderedRoutes = [...result.routes].sort(
    (first) => (first.id === result.selectedRouteId ? 1 : -1),
  )

  return orderedRoutes.map((route) => {
    const isSelected = route.id === result.selectedRouteId
    return (
      <Polyline
        key={route.id}
        positions={route.geometry.coordinates.map(([lon, lat]) => [lat, lon])}
        pathOptions={{
          color: isSelected ? '#16764a' : '#53675c',
          opacity: isSelected ? 0.96 : 0.38,
          weight: isSelected ? 7 : 4,
          dashArray: isSelected ? undefined : '8 10',
        }}
      >
        <Tooltip sticky>
          {isSelected ? 'Greener route' : 'Alternative'} ·{' '}
          {route.greenScore ?? '—'}/100 green
        </Tooltip>
      </Polyline>
    )
  })
}

function GreeneryPoints({ points }) {
  const styles = {
    tree: { color: '#17653d', fillColor: '#36a765', radius: 3 },
    shrub: { color: '#647c2e', fillColor: '#a9c85e', radius: 3.5 },
    forest: { color: '#0d5035', fillColor: '#16764a', radius: 4 },
  }

  return points.map((point) => {
    const style = styles[point.type]
    return (
      <CircleMarker
        key={point.id}
        center={[point.lat, point.lon]}
        radius={style.radius}
        pathOptions={{
          color: style.color,
          fillColor: style.fillColor,
          fillOpacity: 0.78,
          opacity: 0.55,
          weight: 0.7,
        }}
      >
        <Popup>
          <article className="map-popup">
            <p className="map-popup__eyebrow">{point.type} record</p>
            <strong>{point.name}</strong>
            <dl>
              <div><dt>District</dt><dd>{point.district}</dd></div>
              <div><dt>Detail</dt><dd>{point.detail || 'Not recorded'}</dd></div>
              <div><dt>Source</dt><dd>Warsaw Open Data</dd></div>
            </dl>
          </article>
        </Popup>
      </CircleMarker>
    )
  })
}

function GreenWaypoints({ points = [] }) {
  return points.map((point, index) => (
    <CircleMarker
      key={`${point.lon}-${point.lat}-${index}`}
      center={[point.lat, point.lon]}
      radius={6}
      pathOptions={{
        color: '#ffffff',
        fillColor: '#e6a637',
        fillOpacity: 1,
        opacity: 1,
        weight: 2,
      }}
    >
      <Popup>
        <strong>Green corridor anchor</strong>
        <br />
        Nearby: {point.treeCount} trees, {point.shrubCount} shrubs, and{' '}
        {point.forestCount} forest records
        {point.greenAreaName && (
          <><br />Inside {point.greenAreaName}</>
        )}
      </Popup>
    </CircleMarker>
  ))
}

function RouteEndpoints({ result }) {
  if (!result) return null

  return [
    { key: 'from', place: result.from, label: 'Start', color: '#17231d' },
    { key: 'to', place: result.to, label: 'Destination', color: '#f25f45' },
  ].map(({ key, place, label, color }) => (
    <CircleMarker
      key={key}
      center={[place.lat, place.lon]}
      radius={8}
      pathOptions={{ color: '#fff', fillColor: color, fillOpacity: 1, weight: 3 }}
    >
      <Popup><strong>{label}</strong><br />{place.label}</Popup>
    </CircleMarker>
  ))
}

function Map({ activeLayers, airStations, routeResult, userPosition }) {
  const selectedRoute = routeResult?.routes.find(
    ({ id }) => id === routeResult.selectedRouteId,
  )
  const selectedGreenery = selectedRoute?.greenery ?? routeResult?.greenery ?? []

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
            <AirQualityStations stations={airStations} />
          </LayerGroup>
        )}

        <RouteLines result={routeResult} />

        {activeLayers.greenery && routeResult && (
          <LayerGroup>
            <GreeneryPoints points={selectedGreenery} />
            <GreenWaypoints points={selectedRoute?.greenWaypoints} />
          </LayerGroup>
        )}

        <RouteEndpoints result={routeResult} />

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
        <FitRoute result={routeResult} />
      </MapContainer>
    </section>
  )
}

export default Map
