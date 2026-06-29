import { useState, useCallback } from "react";

/**
 * useState with automatic localStorage persistence.
 * Handles JSON serialisation/deserialisation and parse errors gracefully.
 *
 * @param {string} key - localStorage key
 * @param {*} initialValue - used when the key is absent or parse fails
 */
export function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        try {
            const next = value instanceof Function ? value(storedValue) : value;
            setStoredValue(next);
            window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
            /* quota exceeded or private-mode — silently ignore */
        }
    }, [key, storedValue]);

    const remove = useCallback(() => {
        try {
            setStoredValue(initialValue);
            window.localStorage.removeItem(key);
        } catch {
            /* ignore */
        }
    }, [key, initialValue]);

    return [storedValue, setValue, remove];
}
