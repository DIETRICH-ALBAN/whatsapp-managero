import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSiteUrl() {
  // En priorité, utiliser l'URL définie en variable d'environnement
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }

  // Sinon, utiliser l'URL actuelle du navigateur (client-side)
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin
  }

  // En dernier recours, localhost
  return 'http://localhost:3000'
}
