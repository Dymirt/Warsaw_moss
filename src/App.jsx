import { useCallback, useEffect, useState } from 'react'
import Map from './maps/Map.jsx'
import Banner from './banner/Banner.jsx'
import { requestJson } from './api.js'
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
        const payload = await requestJson('/api/air', {
          signal: controller.signal,
        })

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
      const payload = await requestJson('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeRequest),
      })

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
    </main>
  )
}

export default App
