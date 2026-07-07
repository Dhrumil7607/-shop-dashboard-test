const LAUNCH_DATE_KEY = "shoplivebharat.launchDate";
const DEFAULT_LAUNCH_DATE = "2026-06-28T00:00:00+05:30";

function shouldUseDefaultLaunchDate(stored) {
    if (!stored) return true;
    return new Date(stored).getTime() < new Date(DEFAULT_LAUNCH_DATE).getTime();
}

export function getStoredLaunchDate() {
    if (typeof window === "undefined") {
        return DEFAULT_LAUNCH_DATE;
    }

    const stored = window.localStorage.getItem(LAUNCH_DATE_KEY);
    if (!shouldUseDefaultLaunchDate(stored)) return stored;

    window.localStorage.setItem(LAUNCH_DATE_KEY, DEFAULT_LAUNCH_DATE);
    return DEFAULT_LAUNCH_DATE;
}

export function storeLaunchDate(launchDate) {
    if (!launchDate || typeof window === "undefined") return;
    window.localStorage.setItem(LAUNCH_DATE_KEY, launchDate);
}
