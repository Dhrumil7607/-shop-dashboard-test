/**
 * SEO Configuration and Metadata Management
 * Provides dynamic meta tags, structured data, and SEO utilities
 */

const SITE_CONFIG = {
    name: "ShopLive Bharat",
    baseUrl: "https://shoplivebharat.com",
    description: "Premium live shopping platform featuring luxury Indian fashion, jewelry, and home decor",
    keywords: "live shopping, luxury fashion, Indian designers, jewelry, wedding wear",
    twitterHandle: "@shoplivebharat",
    fbAppId: "YOUR_FB_APP_ID",
};

/**
 * Set dynamic meta tags for page
 * @param {Object} config - Meta tag configuration
 */
export const setMetaTags = (config) => {
    const {
        title = SITE_CONFIG.name,
        description = SITE_CONFIG.description,
        image = `${SITE_CONFIG.baseUrl}/og-image.jpg`,
        url = SITE_CONFIG.baseUrl,
        type = "website",
        keywords,
    } = config;

    // Update title
    document.title = title;

    // Update or create meta tags
    const setMeta = (name, content) => {
        let meta = document.querySelector(`meta[${name.includes(":") ? `property` : `name`}="${name}"]`);
        if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute(name.includes(":") ? "property" : "name", name);
            document.head.appendChild(meta);
        }
        meta.setAttribute("content", content);
    };

    // Basic meta tags
    setMeta("description", description);
    if (keywords) setMeta("keywords", keywords);

    // Open Graph
    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:image", image);
    setMeta("og:url", url);
    setMeta("og:type", type);

    // Twitter
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", image);
    setMeta("twitter:card", "summary_large_image");

    // Canonical
    const canonical = document.querySelector("link[rel='canonical']");
    if (canonical) {
        canonical.href = url;
    } else {
        const link = document.createElement("link");
        link.rel = "canonical";
        link.href = url;
        document.head.appendChild(link);
    }
};

/**
 * Generate JSON-LD structured data
 */
export const generateStructuredData = (type, data) => {
    const baseStructure = {
        "@context": "https://schema.org",
        "@type": type,
    };

    const structures = {
        Product: {
            ...baseStructure,
            name: data.name,
            description: data.description,
            image: data.image,
            sku: data.sku,
            brand: { "@type": "Brand", name: "ShopLive Bharat" },
            offers: {
                "@type": "Offer",
                url: data.url,
                priceCurrency: data.currency || "INR",
                price: data.price,
                availability: data.inStock ? "InStock" : "OutOfStock",
            },
            aggregateRating: data.rating && {
                "@type": "AggregateRating",
                ratingValue: data.rating.value,
                ratingCount: data.rating.count,
                reviewCount: data.rating.count,
            },
        },
        BreadcrumbList: {
            ...baseStructure,
            itemListElement: data.items.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: item.name,
                item: item.url,
            })),
        },
        LocalBusiness: {
            ...baseStructure,
            name: data.name || SITE_CONFIG.name,
            image: data.image,
            description: data.description,
            url: data.url || SITE_CONFIG.baseUrl,
            telephone: data.phone,
            address: {
                "@type": "PostalAddress",
                addressCountry: data.country || "IN",
            },
        },
        VideoObject: {
            ...baseStructure,
            name: data.name,
            description: data.description,
            thumbnailUrl: data.thumbnail,
            uploadDate: data.uploadDate,
            duration: data.duration,
            contentUrl: data.videoUrl,
        },
    };

    return structures[type] || baseStructure;
};

/**
 * Inject JSON-LD script into page
 */
export const injectStructuredData = (type, data) => {
    const structuredData = generateStructuredData(type, data);
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
};

/**
 * Generate breadcrumb schema
 */
export const generateBreadcrumbs = (breadcrumbs) => {
    const structure = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            item: `${SITE_CONFIG.baseUrl}${item.path}`,
        })),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(structure);
    document.head.appendChild(script);
};

/**
 * Generate product collection schema
 */
export const generateProductCollectionSchema = (collection) => {
    return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: collection.name,
        description: collection.description,
        url: collection.url,
        mainEntity: {
            "@type": "ItemList",
            itemListElement: collection.products.map((product, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: product.url,
                name: product.name,
                image: product.image,
                offers: {
                    "@type": "Offer",
                    priceCurrency: "INR",
                    price: product.price,
                },
            })),
        },
    };
};

/**
 * SEO Best Practices Checklist
 */
export const seoChecklist = {
    pages: {
        "/": {
            title: "ShopLive Bharat | Premium Live Shopping Experience",
            description: "Discover luxury Indian fashion, jewelry, and home decor through personalized live shopping sessions",
            keywords: "live shopping, luxury fashion, Indian jewelry, video shopping",
        },
        "/marketplace": {
            title: "Shop Luxury Collections | ShopLive Bharat Marketplace",
            description: "Browse premium Indian fashion and jewelry from exclusive artisans and designers",
            keywords: "online shopping India, luxury fashion, Indian jewelry, traditional wear",
        },
        "/product": {
            title: "{product_name} | ShopLive Bharat",
            description: "{product_name} - Premium {category} from India. Authentic, high-quality, worldwide delivery.",
            keywords: "{product_name}, {category}, luxury fashion, Indian jewelry",
        },
        "/live-shopping": {
            title: "Book Live Shopping Session | Premium Guidance",
            description: "Personalized video shopping session with expert consultants from India's finest ateliers",
            keywords: "live shopping session, video shopping, personal consultant, Indian fashion",
        },
        "/booked-slots": {
            title: "My Booked Consultations | ShopLive Bharat",
            description: "Manage your personalized video consultation bookings with expert fashion consultants",
        },
    },
};

/**
 * Mobile SEO Optimization
 */
export const mobileOptimizations = {
    // Viewport already set in index.html
    // Add font-display: swap for web fonts (already done in fonts link)
    // Ensure touch targets are minimum 48x48px
    // Use responsive images with srcset
    // Minimize render-blocking resources
};

/**
 * Performance SEO Metrics
 */
export const performanceMetrics = {
    // Core Web Vitals targets
    largestContentfulPaint: {
        good: 2500, // 2.5s
        needsImprovement: 4000, // 4s
    },
    firstInputDelay: {
        good: 100, // 100ms
        needsImprovement: 300, // 300ms
    },
    cumulativeLayoutShift: {
        good: 0.1,
        needsImprovement: 0.25,
    },
};

export default {
    SITE_CONFIG,
    setMetaTags,
    generateStructuredData,
    injectStructuredData,
    generateBreadcrumbs,
    generateProductCollectionSchema,
    seoChecklist,
};
