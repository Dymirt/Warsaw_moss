const WARSAW_API = 'https://api.um.warszawa.pl/api/action'
const WARSAW_PROXY_PATH = '/api/warsaw-proxy'
const NOMINATIM_API = 'https://nominatim.openstreetmap.org'
const VALHALLA_API = 'https://valhalla1.openstreetmap.de/route'
const PROJECT_USER_AGENT =
  'EcoNavigate/0.2 (https://github.com/Dymirt/Warsaw_moss)'
const WARSAW_REQUEST_OPTIONS = {
  headers: {
    Accept: 'application/json',
    'User-Agent': PROJECT_USER_AGENT,
  },
}

function createWarsawRequest(action, searchParams, apiToken) {
  const proxyToken = apiToken || process.env.WARSAW_API_TOKEN

  if (process.env.VERCEL_URL && proxyToken) {
    const url = new URL(`https://${process.env.VERCEL_URL}${WARSAW_PROXY_PATH}`)
    const proxyParams = new URLSearchParams(searchParams)
    proxyParams.delete('apikey')
    proxyParams.set('action', action)
    url.search = proxyParams

    return {
      url,
      options: {
        headers: {
          ...WARSAW_REQUEST_OPTIONS.headers,
          Authorization: `Bearer ${proxyToken}`,
        },
      },
    }
  }

  const url = new URL(`${WARSAW_API}/${action}/`)
  url.search = new URLSearchParams(searchParams)
  return { url, options: WARSAW_REQUEST_OPTIONS }
}

const WARSAW_VIEWBOX = '20.8517,52.3681,21.2712,52.0978'
const CACHE_TTL = {
  air: 5 * 60 * 1000,
  geocode: 24 * 60 * 60 * 1000,
  greenery: 60 * 60 * 1000,
}

const GREENERY_RESOURCES = {
  tree: {
    id: 'ed6217dd-c8d0-4f7b-8bed-3b7eb81a95ba',
    fields:
      '_id,x_wgs84,y_wgs84,gatunek,stan_zdrowia,dzielnica,adres',
  },
  shrub: {
    id: '0b1af81f-247d-4266-9823-693858ad5b5d',
    fields:
      '_id,x_wgs84,y_wgs84,gatunek,stan_zdrowia,dzielnica,adres',
  },
  forest: {
    id: '75bedfd5-6c83-426b-9ae5-f03651857a48',
    fields:
      '_id,x_wgs84,y_wgs84,dzielnica,obwód,osiedle,gat_panujacy,wiek',
  },
}

const DISTRICT_ALIASES = new Map(
  [
    ['bemowo', 'Bemowo'],
    ['bialoleka', 'Białołęka'],
    ['bielany', 'Bielany'],
    ['mokotow', 'Mokotów'],
    ['ochota', 'Ochota'],
    ['praga polnoc', 'Praga Północ'],
    ['praga połnoc', 'Praga Północ'],
    ['praga poludnie', 'Praga Południe'],
    ['praga południe', 'Praga Południe'],
    ['rembertow', 'Rembertów'],
    ['srodmiescie', 'Śródmieście'],
    ['targowek', 'Targówek'],
    ['ursus', 'Ursus'],
    ['ursynow', 'Ursynów'],
    ['wawer', 'Wawer'],
    ['wesola', 'Wesoła'],
    ['wilanow', 'Wilanów'],
    ['wlochy', 'Włochy'],
    ['wola', 'Wola'],
    ['zoliborz', 'Żoliborz'],
  ].sort(([left], [right]) => right.length - left.length),
)

const memoryCache = new Map()
let nominatimQueue = Promise.resolve()
let nextNominatimRequestAt = 0

class ApiError extends Error {
  constructor(message, status = 500) {
    super(message)
    this.status = status
  }
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('-', ' ')
    .toLocaleLowerCase('pl')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveDistrict(address = {}, displayName = '') {
  const candidates = [
    address.city_district,
    address.suburb,
    address.borough,
    address.quarter,
    displayName,
  ]
    .filter(Boolean)
    .map(normalizeText)

  for (const [alias, officialName] of DISTRICT_ALIASES) {
    if (candidates.some((candidate) => candidate.includes(alias))) {
      return officialName
    }
  }

  return null
}

async function cached(key, ttl, load) {
  const existing = memoryCache.get(key)

  if (existing?.value && existing.expiresAt > Date.now()) {
    return existing.value
  }

  if (existing?.promise) return existing.promise

  const promise = load()
    .then((value) => {
      memoryCache.set(key, { value, expiresAt: Date.now() + ttl })
      return value
    })
    .catch((error) => {
      memoryCache.delete(key)
      throw error
    })

  memoryCache.set(key, { promise, expiresAt: 0 })
  return promise
}

function scheduleNominatim(request) {
  const scheduled = nominatimQueue.then(async () => {
    const delay = Math.max(0, nextNominatimRequestAt - Date.now())
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay))
    nextNominatimRequestAt = Date.now() + 1100
    return request()
  })

  nominatimQueue = scheduled.catch(() => undefined)
  return scheduled
}

async function fetchJson(url, options = {}, source = 'Upstream service') {
  let response

  try {
    response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(65_000),
    })
  } catch (error) {
    throw new ApiError(`${source} could not be reached. Please try again.`, 502, {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new ApiError(`${source} returned an error. Please try again.`, 502)
  }

  try {
    return await response.json()
  } catch (error) {
    throw new ApiError(`${source} returned an unreadable response.`, 502, {
      cause: error,
    })
  }
}

function compactLabel(displayName) {
  return displayName.split(',').slice(0, 4).join(',').trim()
}

function normalizePlace(result) {
  return {
    lat: Number(result.lat),
    lon: Number(result.lon),
    label: compactLabel(result.display_name),
    district: resolveDistrict(result.address, result.display_name),
  }
}

async function geocode(query) {
  const normalizedQuery = normalizeText(query)

  return cached(`geocode:${normalizedQuery}`, CACHE_TTL.geocode, () =>
    scheduleNominatim(async () => {
      const url = new URL('/search', NOMINATIM_API)
      url.search = new URLSearchParams({
        q: `${query}, Warszawa`,
        format: 'jsonv2',
        addressdetails: '1',
        limit: '1',
        countrycodes: 'pl',
        viewbox: WARSAW_VIEWBOX,
        bounded: '1',
      })

      const results = await fetchJson(
        url,
        { headers: { 'User-Agent': PROJECT_USER_AGENT } },
        'Address search',
      )

      if (!Array.isArray(results) || !results.length) {
        throw new ApiError(`Could not find “${query}” in Warsaw.`, 404)
      }

      return normalizePlace(results[0])
    }),
  )
}

async function reverseGeocode([lon, lat]) {
  const cacheKey = `reverse:${lat.toFixed(3)}:${lon.toFixed(3)}`

  return cached(cacheKey, CACHE_TTL.geocode, () =>
    scheduleNominatim(async () => {
      const url = new URL('/reverse', NOMINATIM_API)
      url.search = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        format: 'jsonv2',
        addressdetails: '1',
        zoom: '10',
      })

      const result = await fetchJson(
        url,
        { headers: { 'User-Agent': PROJECT_USER_AGENT } },
        'District lookup',
      )

      return normalizePlace(result)
    }),
  )
}

async function fetchRoutes(from, to, mode) {
  const costing = mode === 'cycling' ? 'bicycle' : 'pedestrian'
  const request = {
    locations: [
      { lat: from.lat, lon: from.lon },
      { lat: to.lat, lon: to.lon },
    ],
    costing,
    alternates: 2,
    format: 'osrm',
    shape_format: 'geojson',
    language: 'en-US',
    directions_type: 'none',
  }

  if (costing === 'bicycle') {
    request.costing_options = {
      bicycle: { bicycle_type: 'city', use_roads: 0.2 },
    }
  }

  const url = new URL(VALHALLA_API)
  url.searchParams.set('json', JSON.stringify(request))
  const payload = await fetchJson(url, {}, 'Route service')

  if (payload.code !== 'Ok' || !Array.isArray(payload.routes) || !payload.routes.length) {
    throw new ApiError('No walkable or cyclable route was found.', 404)
  }

  return payload.routes.map((route, index) => ({
    id: `route-${index + 1}`,
    distance: Number(route.distance),
    duration: Number(route.duration),
    summary: route.legs?.[0]?.summary || 'Warsaw route',
    geometry: route.geometry,
  }))
}

function normalizeGreeneryRecord(type, record) {
  const lon = Number(record.x_wgs84)
  const lat = Number(record.y_wgs84)

  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null

  if (type === 'forest') {
    return {
      id: `${type}-${record._id}`,
      type,
      lon,
      lat,
      district: record.dzielnica,
      name: record.gat_panujacy || record.obwód || 'Forest area',
      detail: record.wiek ? `${record.wiek} years` : record.osiedle || '',
    }
  }

  return {
    id: `${type}-${record._id}`,
    type,
    lon,
    lat,
    district: record.dzielnica,
    name: record.gatunek || (type === 'tree' ? 'Tree' : 'Shrub'),
    detail: record.stan_zdrowia || record.adres || '',
  }
}

async function fetchGreeneryResource(type, district) {
  const resource = GREENERY_RESOURCES[type]
  const cacheKey = `greenery:${type}:${district}`

  return cached(cacheKey, CACHE_TTL.greenery, async () => {
    const request = createWarsawRequest('datastore_search', {
      resource_id: resource.id,
      filters: JSON.stringify({ dzielnica: district }),
      fields: resource.fields,
      limit: '50000',
    })

    const payload = await fetchJson(
      request.url,
      request.options,
      'Warsaw greenery data',
    )
    const records = payload.result?.records

    if (!Array.isArray(records)) {
      throw new ApiError('Warsaw greenery data had an unexpected format.', 502)
    }

    return records
      .map((record) => normalizeGreeneryRecord(type, record))
      .filter(Boolean)
  })
}

async function fetchGreenery(districts) {
  const requests = districts.flatMap((district) =>
    Object.keys(GREENERY_RESOURCES).map((type) => ({
      type,
      district,
      promise: fetchGreeneryResource(type, district),
    })),
  )
  const results = await Promise.allSettled(requests.map(({ promise }) => promise))
  const points = []
  const warnings = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      points.push(...result.value)
    } else {
      const request = requests[index]
      warnings.push(`${request.type} data for ${request.district} was unavailable`)
    }
  })

  return {
    points: [...new Map(points.map((point) => [point.id, point])).values()],
    warnings,
  }
}

function toMeters([lon, lat]) {
  return [lon * 67_800, lat * 111_320]
}

function distanceMeters(first, second) {
  const [firstX, firstY] = toMeters(first)
  const [secondX, secondY] = toMeters(second)
  return Math.hypot(firstX - secondX, firstY - secondY)
}

function sampleRoute(coordinates, spacing = 55) {
  if (coordinates.length < 2) return coordinates

  const samples = [coordinates[0]]
  let distanceSinceSample = 0

  for (let index = 1; index < coordinates.length; index += 1) {
    let start = coordinates[index - 1]
    const end = coordinates[index]
    let segmentLength = distanceMeters(start, end)

    while (distanceSinceSample + segmentLength >= spacing) {
      const required = spacing - distanceSinceSample
      const ratio = segmentLength ? required / segmentLength : 0
      start = [
        start[0] + (end[0] - start[0]) * ratio,
        start[1] + (end[1] - start[1]) * ratio,
      ]
      samples.push(start)
      segmentLength = distanceMeters(start, end)
      distanceSinceSample = 0
    }

    distanceSinceSample += segmentLength
  }

  samples.push(coordinates.at(-1))
  return samples
}

function routeBounds(routes, padding = 0.003) {
  const coordinates = routes.flatMap((route) => route.geometry.coordinates)
  const longitudes = coordinates.map(([longitude]) => longitude)
  const latitudes = coordinates.map(([, latitude]) => latitude)

  return {
    west: Math.min(...longitudes) - padding,
    south: Math.min(...latitudes) - padding,
    east: Math.max(...longitudes) + padding,
    north: Math.max(...latitudes) + padding,
  }
}

function buildSpatialGrid(points, cellSize = 80) {
  const grid = new Map()

  points.forEach((point) => {
    const [x, y] = toMeters([point.lon, point.lat])
    const key = `${Math.floor(x / cellSize)}:${Math.floor(y / cellSize)}`
    const cell = grid.get(key) ?? []
    cell.push({ ...point, x, y })
    grid.set(key, cell)
  })

  return { grid, cellSize }
}

function nearbyCounts(coordinate, spatialGrid) {
  const [x, y] = toMeters(coordinate)
  const centerX = Math.floor(x / spatialGrid.cellSize)
  const centerY = Math.floor(y / spatialGrid.cellSize)
  const counts = { tree: 0, shrub: 0, forest: 0 }

  for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
    for (let offsetY = -2; offsetY <= 2; offsetY += 1) {
      const cell = spatialGrid.grid.get(`${centerX + offsetX}:${centerY + offsetY}`)
      if (!cell) continue

      cell.forEach((point) => {
        const radius = point.type === 'forest' ? 125 : 65
        if (Math.hypot(point.x - x, point.y - y) <= radius) {
          counts[point.type] += 1
        }
      })
    }
  }

  return counts
}

function scoreRoute(route, spatialGrid, hasGreenery) {
  if (!hasGreenery) return { ...route, greenScore: null, sampleCount: 0 }

  const samples = sampleRoute(route.geometry.coordinates)
  const total = samples.reduce((score, coordinate) => {
    const counts = nearbyCounts(coordinate, spatialGrid)
    const treeScore = Math.min(counts.tree, 8) / 8
    const shrubScore = Math.min(counts.shrub, 4) / 4
    const forestScore = Math.min(counts.forest, 5) / 5
    return score + treeScore * 0.55 + shrubScore * 0.2 + forestScore * 0.25
  }, 0)

  return {
    ...route,
    greenScore: Math.round((total / samples.length) * 100),
    sampleCount: samples.length,
  }
}

function pointToSegmentDistance(point, start, end) {
  const [pointX, pointY] = toMeters(point)
  const [startX, startY] = toMeters(start)
  const [endX, endY] = toMeters(end)
  const deltaX = endX - startX
  const deltaY = endY - startY
  const lengthSquared = deltaX * deltaX + deltaY * deltaY
  const projection = lengthSquared
    ? Math.max(
        0,
        Math.min(
          1,
          ((pointX - startX) * deltaX + (pointY - startY) * deltaY) /
            lengthSquared,
        ),
      )
    : 0

  return Math.hypot(
    pointX - (startX + projection * deltaX),
    pointY - (startY + projection * deltaY),
  )
}

function distanceToRoute(point, coordinates) {
  let closest = Number.POSITIVE_INFINITY

  for (let index = 1; index < coordinates.length; index += 1) {
    closest = Math.min(
      closest,
      pointToSegmentDistance(point, coordinates[index - 1], coordinates[index]),
    )
    if (closest < 25) break
  }

  return closest
}

function selectRouteGreenery(points, route) {
  const nearby = points.filter((point) => {
    const radius = point.type === 'forest' ? 150 : 110
    return distanceToRoute([point.lon, point.lat], route.geometry.coordinates) <= radius
  })
  const counts = nearby.reduce(
    (totals, point) => ({ ...totals, [point.type]: totals[point.type] + 1 }),
    { tree: 0, shrub: 0, forest: 0 },
  )
  const stride = Math.max(1, Math.ceil(nearby.length / 450))

  return { points: nearby.filter((_, index) => index % stride === 0), counts }
}

export async function buildGreenRoute({ from: fromQuery, to: toQuery, mode }) {
  if (typeof fromQuery !== 'string' || typeof toQuery !== 'string') {
    throw new ApiError('Enter a starting point and destination.', 400)
  }

  const fromValue = fromQuery.trim()
  const toValue = toQuery.trim()
  const travelMode = mode === 'cycling' ? 'cycling' : 'walking'

  if (fromValue.length < 3 || toValue.length < 3) {
    throw new ApiError('Both places must contain at least three characters.', 400)
  }

  if (fromValue.length > 160 || toValue.length > 160) {
    throw new ApiError('Place names are too long.', 400)
  }

  const [from, to] = await Promise.all([geocode(fromValue), geocode(toValue)])
  const routes = await fetchRoutes(from, to, travelMode)
  const fastestRoute = routes.reduce((shortest, route) =>
    route.distance < shortest.distance ? route : shortest,
  )
  const midpoint =
    fastestRoute.geometry.coordinates[
      Math.floor(fastestRoute.geometry.coordinates.length / 2)
    ]
  let midpointDistrict = null

  if (from.district !== to.district) {
    try {
      midpointDistrict = (await reverseGeocode(midpoint)).district
    } catch {
      midpointDistrict = null
    }
  }

  const districts = [...new Set([from.district, midpointDistrict, to.district].filter(Boolean))]
  const greenery = await fetchGreenery(districts)
  const bounds = routeBounds(routes)
  const corridorPoints = greenery.points.filter(
    ({ lon, lat }) =>
      lon >= bounds.west &&
      lon <= bounds.east &&
      lat >= bounds.south &&
      lat <= bounds.north,
  )
  const spatialGrid = buildSpatialGrid(corridorPoints)
  const shortestDistance = Math.min(...routes.map(({ distance }) => distance))
  const scoredRoutes = routes.map((route) => {
    const scored = scoreRoute(route, spatialGrid, corridorPoints.length > 0)
    const detourPercent = Math.round(
      ((route.distance - shortestDistance) / shortestDistance) * 100,
    )

    return {
      ...scored,
      detourPercent,
      rankScore:
        scored.greenScore === null
          ? -detourPercent
          : scored.greenScore - detourPercent * 1.25,
    }
  })
  const selected = scoredRoutes.reduce((best, route) =>
    route.rankScore > best.rankScore ? route : best,
  )
  const routeGreenery = selectRouteGreenery(corridorPoints, selected)

  return {
    from,
    to,
    mode: travelMode,
    districts,
    selectedRouteId: selected.id,
    routes: scoredRoutes.map((route) => {
      const publicRoute = { ...route }
      delete publicRoute.rankScore
      return publicRoute
    }),
    greenery: routeGreenery.points,
    ecoCounts: routeGreenery.counts,
    warnings: greenery.warnings,
    calculatedAt: new Date().toISOString(),
  }
}

export async function getAirQuality(apiToken) {
  if (!apiToken) {
    throw new ApiError('WARSAW_API_TOKEN is not configured on the server.', 503)
  }

  return cached('air-quality', CACHE_TTL.air, async () => {
    const request = createWarsawRequest(
      'air_sensors_get',
      { apikey: apiToken },
      apiToken,
    )
    const payload = await fetchJson(
      request.url,
      request.options,
      'Warsaw air-quality service',
    )

    if (!Array.isArray(payload.result)) {
      throw new ApiError('Warsaw air-quality data had an unexpected format.', 502)
    }

    return {
      stations: payload.result,
      fetchedAt: new Date().toISOString(),
    }
  })
}

export function formatApiError(error) {
  const isKnownError = error instanceof ApiError

  if (!isKnownError) console.error(error)

  return {
    status: isKnownError ? error.status : 500,
    message: isKnownError ? error.message : 'An unexpected server error occurred.',
  }
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''

    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 20_000) {
        reject(new ApiError('Request body is too large.', 413))
        request.destroy()
      }
    })

    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new ApiError('Request body must be valid JSON.', 400))
      }
    })
    request.on('error', reject)
  })
}

function sendJson(response, status, data) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(data))
}

function createApiMiddleware(apiToken) {
  return async (request, response, next) => {
    const url = new URL(request.url, 'http://localhost')

    if (!url.pathname.startsWith('/api/')) {
      next()
      return
    }

    try {
      if (request.method === 'GET' && url.pathname === '/api/air') {
        sendJson(response, 200, await getAirQuality(apiToken))
        return
      }

      if (request.method === 'POST' && url.pathname === '/api/route') {
        const body = await readJsonBody(request)
        sendJson(response, 200, await buildGreenRoute(body))
        return
      }

      if (request.method === 'GET' && url.pathname === '/api/health') {
        sendJson(response, 200, {
          ok: true,
          warsawTokenConfigured: Boolean(apiToken),
        })
        return
      }

      sendJson(response, 404, { error: 'API route not found.' })
    } catch (error) {
      const { status, message } = formatApiError(error)
      sendJson(response, status, { error: message })
    }
  }
}

export function ecoApiPlugin(apiToken) {
  const middleware = createApiMiddleware(apiToken)

  return {
    name: 'eco-navigate-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
