/**
 * Custom Hook: useIntersectionObserver
 * Reusable hook for lazy loading images and infinite scroll
 * Prevents code duplication across ProductCard, ProductGrid, and StoreGrid
 */

import { useEffect, useRef, useState, useCallback } from "react";

export function useIntersectionObserver(options = {}) {
    const {
        rootMargin = "50px",
        threshold = 0,
        onIntersect = null,
        onLeave = null,
    } = options;

    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [hasIntersected, setHasIntersected] = useState(false);

    useEffect(() => {
        if (!ref.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setIsVisible(entry.isIntersecting);

                    if (entry.isIntersecting) {
                        setHasIntersected(true);
                        onIntersect?.();
                    } else {
                        onLeave?.();
                    }
                });
            },
            {
                rootMargin,
                threshold,
            }
        );

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [rootMargin, threshold, onIntersect, onLeave]);

    return {
        ref,
        isVisible,
        hasIntersected,
    };
}

/**
 * Hook for infinite scroll implementation
 */
export function useInfiniteScroll(options = {}) {
    const {
        hasMore = false,
        isLoading = false,
        onLoadMore = null,
        rootMargin = "100px",
    } = options;

    const [isIntersecting, setIsIntersecting] = useState(false);
    const { ref, isVisible } = useIntersectionObserver({
        rootMargin,
        onIntersect: useCallback(() => {
            if (!hasMore || isLoading || isIntersecting) return;
            setIsIntersecting(true);
            onLoadMore?.();
            setIsIntersecting(false);
        }, [hasMore, isLoading, isIntersecting, onLoadMore]),
    });

    return { ref, isVisible };
}

/**
 * Hook for lazy loading images with fallback
 */
export function useLazyImage(src, fallback = null) {
    const [imageSrc, setImageSrc] = useState(fallback || src);
    const [isLoaded, setIsLoaded] = useState(!!fallback);
    const { ref, hasIntersected } = useIntersectionObserver({
        rootMargin: "50px",
    });

    useEffect(() => {
        if (!hasIntersected) return;

        const img = new Image();
        img.src = src;
        img.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
        };
        img.onerror = () => {
            setImageSrc(fallback || src);
            setIsLoaded(true);
        };
    }, [hasIntersected, src, fallback]);

    return { ref, imageSrc, isLoaded };
}
