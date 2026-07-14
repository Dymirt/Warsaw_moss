const WARSAW_API = 'https://api.um.warszawa.pl/api/action'
const PROJECT_USER_AGENT =
  'EcoNavigate/0.2 (https://github.com/Dymirt/Warsaw_moss)'
const GREENERY_RESOURCES = new Set([
  'ed6217dd-c8d0-4f7b-8bed-3b7eb81a95ba',
  '0b1af81f-247d-4266-9823-693858ad5b5d',
  '75bedfd5-6c83-426b-9ae5-f03651857a48',
])
const DATASTORE_PARAMS = ['resource_id', 'filters', 'fields', 'limit']

export const config = { runtime: 'edge', regions: ['fra1'] }

function json(data, status) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export default async function handler(request) {
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const apiToken = process.env.WARSAW_API_TOKEN
  const authorization = request.headers.get('authorization')

  if (!apiToken || authorization !== `Bearer ${apiToken}`) {
    return json({ error: 'Unauthorized.' }, 401)
  }

  const requestUrl = new URL(request.url)
  const action = requestUrl.searchParams.get('action')
  const upstreamUrl = new URL(`${WARSAW_API}/${action}/`)

  if (action === 'air_sensors_get') {
    upstreamUrl.searchParams.set('apikey', apiToken)
  } else if (action === 'datastore_search') {
    const resourceId = requestUrl.searchParams.get('resource_id')

    if (!GREENERY_RESOURCES.has(resourceId)) {
      return json({ error: 'Unsupported Warsaw resource.' }, 400)
    }

    DATASTORE_PARAMS.forEach((name) => {
      const value = requestUrl.searchParams.get(name)
      if (value !== null) upstreamUrl.searchParams.set(name, value)
    })
  } else {
    return json({ error: 'Unsupported Warsaw action.' }, 400)
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': PROJECT_USER_AGENT,
      },
    })

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
      },
    })
  } catch {
    return json({ error: 'Warsaw API could not be reached.' }, 502)
  }
}
