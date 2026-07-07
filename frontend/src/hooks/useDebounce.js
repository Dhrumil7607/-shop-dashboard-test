import { useEffect, useRef, useState } from "react";

/**
 * Returns a debounced version of `value` that only updates after
 * `delay` ms of inactivity. Cancels cleanly on unmount.
 */
export function useDebounce(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

/**
 * Returns a stable callback that is only invoked after `delay` ms
 * of inactivity. The latest `fn` reference is always used.
 */
export function useDebouncedCallback(fn, delay = 300) {
    const fnRef = useRef(fn);
    useEffect(() => { fnRef.current = fn; }, [fn]);

    const timerRef = useRef(null);
    return (...args) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => fnRef.current(...args), delay);
    };
}
