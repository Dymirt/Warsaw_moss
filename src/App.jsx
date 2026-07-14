import { useCallback, useState } from 'react'
import Map from './maps/Map.jsx'
import Banner from './banner/Banner.jsx'
import './App.css'

function App() {
  const [userPosition, setUserPosition] = useState(null)
  const [activeLayers, setActiveLayers] = useState({ air: true, trees: false })
  const [locationState, setLocationState] = useState({
    status: 'idle',
    message: '',
  })

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

  return (
    <main className="app-shell antialiased">
      <a className="skip-link" href="#map">
        Skip to the map
      </a>
      <Banner
        activeLayers={activeLayers}
        locationState={locationState}
        onLocate={locateUser}
        onToggleLayer={toggleLayer}
      />
      <Map activeLayers={activeLayers} userPosition={userPosition} />
    </main>
  )
}

export default App
