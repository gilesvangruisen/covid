const STATE_CASES = "/states.json"

export function cacheFetch(URL) {
  if (!window.cache) {
    window.cache = {}
  }

  if (!window.cache[URL]) {
    window.cache[URL] = fetch(URL).then((r) => r.json())
  }

  return window.cache[URL]
}

export function getStateCases() {
  return cacheFetch(STATE_CASES)
}
