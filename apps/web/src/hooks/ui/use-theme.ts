import { useEffect, useState } from "react"

import {
  applyTheme,
  createThemeMediaQueryList,
  getStoredTheme,
  getSystemTheme,
  persistTheme,
  resolveInitialTheme,
  type ThemeMode,
} from "@/lib/theme"

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(resolveInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const media = createThemeMediaQueryList()

    const handleChange = () => {
      if (!getStoredTheme()) {
        setTheme(getSystemTheme())
      }
    }

    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [])

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark"
      persistTheme(next)
      return next
    })
  }

  return {
    theme,
    toggleTheme,
  }
}
