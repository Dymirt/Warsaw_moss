import { FaLeaf, FaLocationArrow, FaTree } from 'react-icons/fa'
import { MdAir } from 'react-icons/md'
import './Banner.css'

const Banner = ({ activeLayers, locationState, onLocate, onToggleLayer }) => {
  const isLocating = locationState.status === 'loading'

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
          <p className="eyebrow">Warsaw environmental map</p>
          <h1 id="app-title">Explore a greener Warsaw</h1>
          <p>
            Compare air-quality readings with the city&apos;s public tree inventory
            in one interactive view.
          </p>
        </div>

        <button
          className="locate-button"
          type="button"
          onClick={onLocate}
          disabled={isLocating}
        >
          <FaLocationArrow aria-hidden="true" />
          {isLocating ? 'Finding your location...' : 'Use my location'}
        </button>

        <p
          className={`location-message location-message--${locationState.status}`}
          role="status"
          aria-live="polite"
        >
          {locationState.message}
        </p>

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
                  <strong>Air quality</strong>
                  <small>91 monitoring stations</small>
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
                  <strong>Tree inventory</strong>
                  <small>10,000 public records</small>
                </span>
                <input
                  className="layer-toggle"
                  type="checkbox"
                  checked={activeLayers.trees}
                  onChange={() => onToggleLayer('trees')}
                  aria-label="Show tree inventory"
                />
              </label>
            </li>
          </ul>
        </section>

        <section className="air-legend" aria-labelledby="air-legend-title">
          <h2 id="air-legend-title">Air-quality status</h2>
          <div className="legend-items">
            <span><i className="quality-dot quality-dot--good" />Good</span>
            <span><i className="quality-dot quality-dot--moderate" />Moderate</span>
            <span><i className="quality-dot quality-dot--poor" />Poor</span>
          </div>
        </section>

        <p className="data-note">
          Air readings are a bundled snapshot from 23 November 2024, not live data.
        </p>
      </aside>
    </>
  )
}

export default Banner
