const API_UNAVAILABLE_MESSAGE =
  'Eco Navigate API is unavailable. Check VITE_API_BASE_URL and make sure the FastAPI service is running.'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '')
  .trim()
  .replace(/\/+$/, '')

export async function requestJson(path, options = {}) {
  if (!['http:', 'https:'].includes(window.location.protocol)) {
    throw new Error(API_UNAVAILABLE_MESSAGE)
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, options)
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error(API_UNAVAILABLE_MESSAGE, { cause: error })
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.toLocaleLowerCase().includes('application/json')) {
    throw new Error(API_UNAVAILABLE_MESSAGE)
  }

  let payload

  try {
    payload = await response.json()
  } catch (error) {
    throw new Error('The Eco Navigate API returned invalid JSON.', { cause: error })
  }

  if (!response.ok) {
    throw new Error(payload.error || 'The Eco Navigate API returned an error.')
  }

  return payload
}
