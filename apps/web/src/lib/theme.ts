export type ThemeMode = "light" | "dark"

const themeStorageKey = "brimble-theme"
const darkMediaQuery = "(prefers-color-scheme: dark)"

export function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light"
  }

  return window.matchMedia(darkMediaQuery).matches ? "dark" : "light"
}

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null
  }

  const value = window.localStorage.getItem(themeStorageKey)
  return value === "light" || value === "dark" ? value : null
}

export function resolveInitialTheme(): ThemeMode {
  return getStoredTheme() ?? getSystemTheme()
}

export function persistTheme(theme: ThemeMode) {
  window.localStorage.setItem(themeStorageKey, theme)
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

export function createThemeMediaQueryList() {
  return window.matchMedia(darkMediaQuery)
}
