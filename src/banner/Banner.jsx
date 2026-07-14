import { useState } from 'react'
import {
  FaBicycle,
  FaLeaf,
  FaLocationArrow,
  FaRoute,
  FaTree,
  FaWalking,
} from 'react-icons/fa'
import { MdAir } from 'react-icons/md'
import './Banner.css'

function formatDistance(meters) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60))
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

const Banner = ({
  activeLayers,
  airState,
  locationState,
  onBuildRoute,
  onLocate,
  onToggleLayer,
  routeState,
}) => {
  const isLocating = locationState.status === 'loading'
  const isRouting = routeState.status === 'loading'
  const [from, setFrom] = useState('Pałac Kultury i Nauki')
  const [to, setTo] = useState('Łazienki Królewskie')
  const [mode, setMode] = useState('walking')
  const result = routeState.result
  const selectedRoute = result?.routes.find(
    ({ id }) => id === result.selectedRouteId,
  )

  function submitRoute(event) {
    event.preventDefault()
    onBuildRoute({ from, to, mode })
  }

  return (
    <>
      <header className="brand-rail" aria-label="Eco Navigate">
        <span className="brand-mark" aria-hidden="true">
          <FaLeaf />
        </span>
        <span className="brand-name">Eco Navigate</span>
        <span className="brand-year">Warsaw</span>
      </header>

      <aside className="info-panel" aria-labelledby="app-title">
        <div className="panel-intro">
          <p className="eyebrow">Green routing for Warsaw</p>
          <h1 id="app-title">Take the greener way</h1>
          <p>
            Compare real walking and cycling alternatives by nearby trees, shrubs,
            and forest areas.
          </p>
        </div>

        <form className="route-form" onSubmit={submitRoute}>
          <label>
            <span>From</span>
            <input
              type="text"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              placeholder="Street, landmark, or address"
              autoComplete="street-address"
              required
            />
          </label>
          <label>
            <span>To</span>
            <input
              type="text"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="Your destination"
              autoComplete="off"
              required
            />
          </label>

          <fieldset className="mode-picker">
            <legend>Travel mode</legend>
            <label>
              <input
                type="radio"
                name="mode"
                value="walking"
                checked={mode === 'walking'}
                onChange={() => setMode('walking')}
              />
              <FaWalking aria-hidden="true" />
              Walk
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                value="cycling"
                checked={mode === 'cycling'}
                onChange={() => setMode('cycling')}
              />
              <FaBicycle aria-hidden="true" />
              Cycle
            </label>
          </fieldset>

          <button className="route-button" type="submit" disabled={isRouting}>
            <FaRoute aria-hidden="true" />
            {isRouting ? 'Measuring green cover...' : 'Find greener route'}
          </button>
        </form>

        <div className="utility-row">
          <button
            className="locate-button"
            type="button"
            onClick={onLocate}
            disabled={isLocating}
          >
            <FaLocationArrow aria-hidden="true" />
            {isLocating ? 'Locating...' : 'Center on me'}
          </button>
          <p
            className={`location-message location-message--${locationState.status}`}
            role="status"
            aria-live="polite"
          >
            {locationState.message}
          </p>
        </div>

        <p
          className={`route-message route-message--${routeState.status}`}
          role="alert"
          aria-live="polite"
        >
          {routeState.message}
        </p>

        {selectedRoute && (
          <section className="route-result" aria-labelledby="route-result-title">
            <div className="result-heading">
              <div>
                <p className="eyebrow">Recommended</p>
                <h2 id="route-result-title">Greener route</h2>
              </div>
              <span className="green-score">
                {selectedRoute.greenScore ?? '—'}
                <small>/ 100 green</small>
              </span>
            </div>
            <p className="route-places">
              <strong>{result.from.label}</strong>
              <span aria-hidden="true">→</span>
              <strong>{result.to.label}</strong>
            </p>
            <div className="route-stats">
              <span><strong>{formatDistance(selectedRoute.distance)}</strong>distance</span>
              <span><strong>{formatDuration(selectedRoute.duration)}</strong>estimated</span>
              <span><strong>+{selectedRoute.detourPercent}%</strong>detour</span>
            </div>
            <p className="eco-counts">
              Near the route: {result.ecoCounts.tree.toLocaleString()} trees,{' '}
              {result.ecoCounts.shrub.toLocaleString()} shrubs, and{' '}
              {result.ecoCounts.forest.toLocaleString()} forest records.
            </p>
            <div className="route-options" aria-label="Compared route alternatives">
              {result.routes.map((route, index) => (
                <span
                  key={route.id}
                  className={route.id === result.selectedRouteId ? 'is-selected' : ''}
                >
                  {route.id === result.selectedRouteId ? 'Best green' : `Option ${index + 1}`}
                  <small>{route.greenScore ?? '—'}/100 · {formatDistance(route.distance)}</small>
                </span>
              ))}
            </div>
            {result.warnings.length > 0 && (
              <p className="data-warning">
                Some live greenery feeds did not respond; available records were used.
              </p>
            )}
          </section>
        )}

        <section className="layer-guide" aria-labelledby="layer-guide-title">
          <div className="section-heading">
            <h2 id="layer-guide-title">Map layers</h2>
            <span>Choose overlays</span>
          </div>
          <ul>
            <li>
              <label className="layer-row">
                <span className="layer-icon layer-icon--air" aria-hidden="true">
                  <MdAir />
                </span>
                <span className="layer-copy">
                  <strong>Live air quality</strong>
                  <small>{airState.message}</small>
                </span>
                <input
                  className="layer-toggle"
                  type="checkbox"
                  checked={activeLayers.air}
                  onChange={() => onToggleLayer('air')}
                  aria-label="Show air-quality stations"
                />
              </label>
            </li>
            <li>
              <label className="layer-row">
                <span className="layer-icon layer-icon--trees" aria-hidden="true">
                  <FaTree />
                </span>
                <span className="layer-copy">
                  <strong>Route greenery</strong>
                  <small>{result ? `${result.greenery.length} nearby map points` : 'Appears after routing'}</small>
                </span>
                <input
                  className="layer-toggle"
                  type="checkbox"
                  checked={activeLayers.greenery}
                  onChange={() => onToggleLayer('greenery')}
                  aria-label="Show greenery near the selected route"
                />
              </label>
            </li>
          </ul>
        </section>

        <p className="data-note">
          Live Warsaw Open Data. Air readings cache for 5 minutes; greenery for 1 hour.
        </p>
      </aside>
    </>
  )
}

export default Banner
