import { useCallback, useEffect, useState } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Map from './maps/Map.jsx'
import Banner from './banner/Banner.jsx'
import './App.css'

function App() {
  const [userPosition, setUserPosition] = useState(null)
  const [activeLayers, setActiveLayers] = useState({ air: true, greenery: true })
  const [locationState, setLocationState] = useState({
    status: 'idle',
    message: '',
  })
  const [airState, setAirState] = useState({
    status: 'loading',
    stations: [],
    fetchedAt: null,
    message: 'Loading live stations...',
  })
  const [routeState, setRouteState] = useState({
    status: 'idle',
    result: null,
    message: '',
  })

  useEffect(() => {
    const controller = new AbortController()

    async function loadAirQuality() {
      try {
        const response = await fetch('/api/air', { signal: controller.signal })
        const payload = await response.json()

        if (!response.ok) throw new Error(payload.error || 'Live air data is unavailable.')

        setAirState({
          status: 'success',
          stations: payload.stations,
          fetchedAt: payload.fetchedAt,
          message: `${payload.stations.length} live stations`,
        })
      } catch (error) {
        if (error.name === 'AbortError') return
        setAirState({
          status: 'error',
          stations: [],
          fetchedAt: null,
          message: error.message,
        })
      }
    }

    loadAirQuality()
    return () => controller.abort()
  }, [])

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState({
        status: 'error',
        message: 'Your browser does not support location services.',
      })
      return
    }

    setLocationState({ status: 'loading', message: 'Finding your location...' })

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserPosition([coords.latitude, coords.longitude])
        setLocationState({
          status: 'success',
          message: 'Map centered on your current location.',
        })
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was not granted.'
            : 'Your location could not be determined. Please try again.'

        setLocationState({ status: 'error', message })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [])

  const toggleLayer = useCallback((layer) => {
    setActiveLayers((currentLayers) => ({
      ...currentLayers,
      [layer]: !currentLayers[layer],
    }))
  }, [])

  const buildRoute = useCallback(async (routeRequest) => {
    setRouteState({
      status: 'loading',
      result: null,
      message: 'Finding alternatives and measuring nearby greenery...',
    })

    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeRequest),
      })
      const payload = await response.json()

      if (!response.ok) throw new Error(payload.error || 'A route could not be built.')

      setRouteState({ status: 'success', result: payload, message: '' })
      setActiveLayers((currentLayers) => ({ ...currentLayers, greenery: true }))
    } catch (error) {
      setRouteState({ status: 'error', result: null, message: error.message })
    }
  }, [])

  return (
    <main className="app-shell antialiased">
      <a className="skip-link" href="#map">
        Skip to the map
      </a>
      <Banner
        activeLayers={activeLayers}
        airState={airState}
        locationState={locationState}
        onBuildRoute={buildRoute}
        onLocate={locateUser}
        onToggleLayer={toggleLayer}
        routeState={routeState}
      />
      <Map
        activeLayers={activeLayers}
        airStations={airState.stations}
        routeResult={routeState.result}
        userPosition={userPosition}
      />
      <SpeedInsights />
    </main>
  )
}

export default App
