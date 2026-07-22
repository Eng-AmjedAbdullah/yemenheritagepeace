import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const LoadingContext = createContext(null)

const INITIAL_BOOT_TOKEN = Symbol('initial-app-bootstrap')
const activeTasks = new Map([
  [INITIAL_BOOT_TOKEN, 'initial-app-bootstrap'],
])
const listeners = new Set()

const HIDE_DELAY_MS = 250

let hideTimer = null
let isVisible = true

function getSnapshot() {
  return {
    isLoading: isVisible,
    loadingCount: activeTasks.size,
  }
}

function emitSnapshot() {
  const snapshot = getSnapshot()

  listeners.forEach((listener) => {
    listener(snapshot)
  })
}

function syncVisibility() {
  if (activeTasks.size > 0) {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }

    isVisible = true
    emitSnapshot()
    return
  }

  if (hideTimer) {
    clearTimeout(hideTimer)
  }

  hideTimer = setTimeout(() => {
    hideTimer = null

    if (activeTasks.size === 0) {
      isVisible = false
      emitSnapshot()
    }
  }, HIDE_DELAY_MS)
}

export function startGlobalLoading(label = 'loading-task') {
  const token = Symbol(label)

  activeTasks.set(token, label)
  syncVisibility()

  return token
}

export function stopGlobalLoading(token) {
  if (!token || !activeTasks.has(token)) return

  activeTasks.delete(token)
  syncVisibility()
}

export function finishInitialLoading() {
  stopGlobalLoading(INITIAL_BOOT_TOKEN)
}

export function subscribeGlobalLoading(listener) {
  listeners.add(listener)
  listener(getSnapshot())

  return () => {
    listeners.delete(listener)
  }
}

export function LoadingProvider({ children }) {
  const [snapshot, setSnapshot] = useState(getSnapshot)

  useEffect(() => {
    return subscribeGlobalLoading(setSnapshot)
  }, [])

  const startLoading = useCallback((label) => {
    return startGlobalLoading(label)
  }, [])

  const stopLoading = useCallback((token) => {
    stopGlobalLoading(token)
  }, [])

  const runWithLoading = useCallback(async (label, operation) => {
    if (typeof operation !== 'function') {
      throw new TypeError('runWithLoading requires an async operation function')
    }

    const token = startGlobalLoading(label)

    try {
      return await operation()
    } finally {
      stopGlobalLoading(token)
    }
  }, [])

  const value = useMemo(
    () => ({
      isLoading: snapshot.isLoading,
      loadingCount: snapshot.loadingCount,
      startLoading,
      stopLoading,
      runWithLoading,
    }),
    [
      snapshot.isLoading,
      snapshot.loadingCount,
      startLoading,
      stopLoading,
      runWithLoading,
    ]
  )

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useGlobalLoading() {
  const context = useContext(LoadingContext)

  if (!context) {
    throw new Error(
      'useGlobalLoading must be used inside LoadingProvider'
    )
  }

  return context
}
