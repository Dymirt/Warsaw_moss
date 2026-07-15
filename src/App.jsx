import { useCallback, useEffect, useState } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react'
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

  const requestCurrentPosition = useCallback((successMessage) => {
    if (!navigator.geolocation) {
      const error = new Error('Your browser does not support location services.')
      setLocationState({ status: 'error', message: error.message })
      return Promise.reject(error)
    }

    setLocationState({ status: 'loading', message: 'Finding your location...' })

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const position = [coords.latitude, coords.longitude]
          setUserPosition(position)
          setLocationState({ status: 'success', message: successMessage })
          resolve(position)
        },
        (geolocationError) => {
          const message =
            geolocationError.code === geolocationError.PERMISSION_DENIED
              ? 'Location permission was not granted.'
              : 'Your location could not be determined. Please try again.'
          const error = new Error(message)

          setLocationState({ status: 'error', message })
          reject(error)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      )
    })
  }, [])

  const locateUser = useCallback(() => {
    requestCurrentPosition('Map centered on your current location.').catch(
      () => undefined,
    )
  }, [requestCurrentPosition])

  const toggleLayer = useCallback((layer) => {
    setActiveLayers((currentLayers) => ({
      ...currentLayers,
      [layer]: !currentLayers[layer],
    }))
  }, [])

  const buildRoute = useCallback(
    async ({ to, mode }) => {
      setRouteState({
        status: 'loading',
        result: null,
        message: 'Getting your current location...',
      })

      try {
        const [latitude, longitude] = await requestCurrentPosition(
          'Starting from your current location.',
        )
        setRouteState({
          status: 'loading',
          result: null,
          message: 'Building a route through trees, parks, and green areas...',
        })

        const payload = await requestJson('/api/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: { lat: latitude, lon: longitude, label: 'Your location' },
            to,
            mode,
          }),
        })
        const result = {
          ...payload,
          recommendedRouteId: payload.selectedRouteId,
        }

        setRouteState({ status: 'success', result, message: '' })
        setActiveLayers((currentLayers) => ({ ...currentLayers, greenery: true }))
      } catch (error) {
        setRouteState({ status: 'error', result: null, message: error.message })
      }
    },
    [requestCurrentPosition],
  )

  const selectRoute = useCallback((routeId) => {
    setRouteState((currentState) => {
      if (!currentState.result?.routes.some(({ id }) => id === routeId)) {
        return currentState
      }

      return {
        ...currentState,
        result: { ...currentState.result, selectedRouteId: routeId },
      }
    })
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
        onSelectRoute={selectRoute}
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
