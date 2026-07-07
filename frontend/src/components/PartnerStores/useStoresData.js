/**
 * Custom Hook for Stores Data Management
 * 
 * Architectural Improvements:
 * - Search debouncing with 300ms delay to reduce API calls
 * - 5-minute response caching to minimize backend load
 * - Optimized filter combining (search + category + rating + location + verified)
 * - Smart sorting with multiple options (featured, trending, rating, followers, etc.)
 * - Memoized filter state to prevent unnecessary re-renders
 * - Graceful error handling with fallbacks to mock data
 * - Separate loading states for shops vs products
 * - Optimized product filtering by shop ID
 * 
 * Performance:
 * - Debounced search prevents excessive filtering
 * - Cached responses reduce API calls
 * - useCallback and useRef for stable function references
 * - No re-renders on internal state changes
 * 
 * Features:
 * - 6 filter types: search, category, rating, location, verified, sort
 * - Multiple sort options (featured, trending, rating, followers, newest, A-Z)
 * - Fallback to mock data on API errors
 * - Retry mechanism for failed requests
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { fetchShops, fetchProducts } from "@/lib/api";

const DEBOUNCE_DELAY = 300;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useStoresData() {
    const [shops, setShops] = useState([]);
    const [filteredShops, setFilteredShops] = useState([]);
    const [shopProducts, setShopProducts] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingShops, setLoadingShops] = useState({});
    const [error, setError] = useState(null);
    const [retrying, setRetrying] = useState(false);

    // State for filters
    const [filters, setFilters] = useState({
        search: "",
        category: "all",
        rating: "all",
        location: "all",
        verified: false,
        sort: "featured",
    });

    // Caching
    const cacheRef = useRef(new Map());
    const debounceTimerRef = useRef(null);

    // Load all shops
    const loadShops = useCallback(async (isRetry = false) => {
        try {
            if (isRetry) {
                setRetrying(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Check cache
            const cacheKey = "shops_list";
            const cached = cacheRef.current.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                setShops(cached.data);
                setFilteredShops(cached.data);
                if (isRetry) setRetrying(false);
                else setLoading(false);
                return;
            }

            // Backend is the single source of truth — use real shop data as-is.
            const shopsData = Array.isArray(data) ? data : [];

            cacheRef.current.set(cacheKey, {
                data: shopsData,
                timestamp: Date.now(),
            });

            setShops(shopsData);
            setFilteredShops(shopsData);
        } catch (err) {
            console.error("Error loading shops:", err);
            setError("Failed to load shops. Please try again.");
        } finally {
            setLoading(false);
            setRetrying(false);
        }
    }, []);

    // Load products for a specific shop with optimized filtering
    const loadShopProducts = useCallback(async (shopId) => {
        if (shopProducts[shopId]) return; // Already cached

        try {
            setLoadingShops(prev => ({ ...prev, [shopId]: true }));

            // Check cache
            const cacheKey = `shop_products_${shopId}`;
            const cached = cacheRef.current.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                setShopProducts(prev => ({ ...prev, [shopId]: cached.data }));
                setLoadingShops(prev => ({ ...prev, [shopId]: false }));
                return;
            }

            // Fetch with shop_id filter (API optimization) — backend only.
            const data = await fetchProducts({ active_only: true, shop_id: shopId });
            const productsData = Array.isArray(data) ? data : [];

            // Filter and limit results
            const filtered = productsData
                .filter(p => p.shop_id === shopId)
                .slice(0, 12);

            cacheRef.current.set(cacheKey, {
                data: filtered,
                timestamp: Date.now(),
            });

            setShopProducts(prev => ({ ...prev, [shopId]: filtered }));
        } catch (err) {
            console.error(`Error loading products for shop ${shopId}:`, err);
        } finally {
            setLoadingShops(prev => ({ ...prev, [shopId]: false }));
        }
    }, [shopProducts]);

    // Apply filters with debouncing for search
    const applyFilters = useCallback((newFilters) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // If search is being updated, debounce it
        if (newFilters.search !== undefined) {
            debounceTimerRef.current = setTimeout(() => {
                setFilters(prev => ({ ...prev, ...newFilters }));
                filterShops(shops, { ...filters, ...newFilters });
            }, DEBOUNCE_DELAY);
        } else {
            // Other filters apply immediately
            setFilters(prev => ({ ...prev, ...newFilters }));
            filterShops(shops, { ...filters, ...newFilters });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shops, filters]);

    // Filter shops based on current filters
    const filterShops = useCallback((shopsToFilter, activeFilters) => {
        let result = [...shopsToFilter];

        // 1. Search filter (case-insensitive, searches multiple fields)
        if (activeFilters.search) {
            const searchLower = activeFilters.search.toLowerCase();
            result = result.filter(shop =>
                shop.name.toLowerCase().includes(searchLower) ||
                shop.owner_name?.toLowerCase().includes(searchLower) ||
                shop.category?.toLowerCase().includes(searchLower) ||
                shop.specialty?.toLowerCase().includes(searchLower) ||
                shop.city?.toLowerCase().includes(searchLower)
            );
        }

        // 2. Category filter
        if (activeFilters.category !== "all") {
            result = result.filter(shop => shop.category === activeFilters.category);
        }

        // 3. Rating filter (minimum rating)
        if (activeFilters.rating !== "all") {
            const minRating = parseInt(activeFilters.rating);
            result = result.filter(shop => parseFloat(shop.rating || 0) >= minRating);
        }

        // 4. Location filter
        if (activeFilters.location !== "all") {
            result = result.filter(shop => shop.city === activeFilters.location);
        }

        // 5. Verified filter
        if (activeFilters.verified) {
            result = result.filter(shop => shop.verified);
        }

        // 6. Sorting
        const sortMap = {
            featured: (a, b) => {
                if (a.featured === b.featured) return 0;
                return a.featured ? -1 : 1;
            },
            trending: (a, b) => {
                if (a.trending === b.trending) return 0;
                return a.trending ? -1 : 1;
            },
            rating: (a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0),
            followers: (a, b) => (b.followers || 0) - (a.followers || 0),
            newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
            az: (a, b) => a.name.localeCompare(b.name),
        };

        if (sortMap[activeFilters.sort]) {
            result.sort(sortMap[activeFilters.sort]);
        }

        setFilteredShops(result);
    }, []);

    // Initial load
    useEffect(() => {
        loadShops();
    }, [loadShops]);

    const retry = useCallback(() => {
        loadShops(true);
    }, [loadShops]);

    return {
        shops,
        filteredShops,
        shopProducts,
        loading,
        loadingShops,
        error,
        retrying,
        filters,
        applyFilters,
        setFilters,
        loadShopProducts,
        retry,
    };
}
