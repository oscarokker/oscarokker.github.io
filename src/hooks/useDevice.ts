"use client";

import { useSyncExternalStore } from "react";

export type DeviceMode = "mobile" | "tablet" | "desktop";

// Breakpoint boundaries (in px)
const MOBILE_MAX = 767;
const TABLET_MAX = 1279;

function getDeviceModeFromWidth(width: number): DeviceMode {
  if (width <= MOBILE_MAX) return "mobile";
  if (width <= TABLET_MAX) return "tablet";
  return "desktop";
}

function getCurrentDevice(): DeviceMode {
  if (typeof window === "undefined") return "desktop";
  return getDeviceModeFromWidth(window.innerWidth);
}

let deviceListeners: Set<() => void> = new Set();
let currentDevice: DeviceMode = "desktop";

// Use matchMedia for efficient viewport tracking
if (typeof window !== "undefined") {
  currentDevice = getCurrentDevice();

  const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
  const tabletQuery = window.matchMedia(
    `(min-width: ${MOBILE_MAX + 1}px) and (max-width: ${TABLET_MAX}px)`,
  );

  const updateDevice = () => {
    const newDevice = getCurrentDevice();
    if (newDevice !== currentDevice) {
      currentDevice = newDevice;
      deviceListeners.forEach((listener) => listener());

      // Update document attribute for CSS
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-device", currentDevice);
      }
    }
  };

  mobileQuery.addEventListener("change", updateDevice);
  tabletQuery.addEventListener("change", updateDevice);

  // Set initial attribute
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-device", currentDevice);
  }
}

function subscribeToDevice(callback: () => void) {
  deviceListeners.add(callback);
  return () => {
    deviceListeners.delete(callback);
  };
}

function getDeviceSnapshot(): DeviceMode {
  return currentDevice;
}

function getServerSnapshot(): DeviceMode {
  // Default to desktop for SSR to match most common initial layout
  return "desktop";
}

/**
 * Hook to get the current device mode based on viewport width.
 * - mobile: 0-767px
 * - tablet: 768-1279px
 * - desktop: 1280px+
 *
 * Updates on resize and syncs with CSS via data-device attribute.
 */
export function useDevice(): DeviceMode {
  return useSyncExternalStore(
    subscribeToDevice,
    getDeviceSnapshot,
    getServerSnapshot,
  );
}

/**
 * Hook for components that need to know if they're on a specific device mode.
 */
export function useIsDevice(mode: DeviceMode): boolean {
  const device = useDevice();
  return device === mode;
}

/**
 * Hook for components that need to know if device is mobile or tablet (not desktop).
 */
export function useIsMobileOrTablet(): boolean {
  const device = useDevice();
  return device === "mobile" || device === "tablet";
}
