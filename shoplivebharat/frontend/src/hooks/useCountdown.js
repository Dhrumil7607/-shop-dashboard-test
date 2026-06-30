import { useEffect, useState, useCallback, useRef } from "react";

export function useCountdown(targetISO) {
    const targetRef = useRef(targetISO ? new Date(targetISO).getTime() : null);

    const compute = useCallback(() => {
        const target = targetRef.current;
        if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: false };
        const diff = target - Date.now();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        return { days, hours, minutes, seconds, done: false };
    }, []);

    const [time, setTime] = useState(compute);

    useEffect(() => {
        targetRef.current = targetISO ? new Date(targetISO).getTime() : null;
        if (!targetRef.current) return;
        setTime(compute());
        const id = setInterval(() => setTime(compute()), 1000);
        return () => clearInterval(id);
    }, [targetISO, compute]);

    return time;
}
