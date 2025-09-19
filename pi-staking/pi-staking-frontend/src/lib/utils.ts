import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function logEvent(event: string, payload?: Record<string, any>) {
  // Lightweight instrumentation
  try {
    console.info(event, payload || {});
  } catch {}
}
