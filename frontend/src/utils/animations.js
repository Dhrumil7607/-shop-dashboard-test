/**
 * 🎬 HEAVY BUT SMOOTH ANIMATIONS LIBRARY
 * 
 * GPU-accelerated animations optimized for 60fps performance.
 * Uses transform and opacity only (no layout-triggering properties).
 * All animations include will-change hints for browser optimization.
 */

// ============================================================================
// EASING FUNCTIONS - Professional motion curves
// ============================================================================

export const easing = {
    // Smooth, natural deceleration
    easeOut: [0.23, 1, 0.32, 1],
    
    // Smooth acceleration and deceleration
    easeInOut: [0.42, 0, 0.58, 1],
    
    // Slightly bouncy, playful
    easeOutBack: [0.33, 1.53, 0.67, 1],
    
    // Quick start, smooth finish
    easeOutQuad: [0.25, 0.46, 0.45, 0.94],
    
    // Snappy but controlled
    easeOutExpo: [0.19, 1, 0.22, 1],
    
    // Subtle elastic bounce
    easeOutElastic: [0.34, 1.56, 0.64, 1],
    
    // Slow start, fast end
    easeInQuad: [0.11, 0.74, 0.69, 0.31],
};

// ============================================================================
// CONTAINER VARIANTS - For staggered animations
// ============================================================================

export const containerVariants = {
    // Fade and scale in with stagger
    fadeInUp: (delay = 0) => ({
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.12,
                delayChildren: delay,
                duration: 0.6,
            },
        },
    }),

    // Subtle stagger with minimal delay
    fadeInFast: (delay = 0) => ({
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: delay,
                duration: 0.4,
            },
        },
    }),

    // Heavy stagger for dramatic effect
    staggerHeavy: (delay = 0) => ({
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: delay,
                duration: 0.8,
            },
        },
    }),
};

// ============================================================================
// ITEM VARIANTS - Individual elements within containers
// ============================================================================

export const itemVariants = {
    // Fade in from bottom with scale
    fadeInUp: {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.6,
                ease: [0.23, 1, 0.32, 1],
            },
        },
    },

    // Fade in from left with slight rotate
    fadeInLeft: {
        hidden: { opacity: 0, x: -40, rotate: -5 },
        visible: {
            opacity: 1,
            x: 0,
            rotate: 0,
            transition: {
                duration: 0.7,
                ease: [0.23, 1, 0.32, 1],
            },
        },
    },

    // Fade in from right with slight rotate
    fadeInRight: {
        hidden: { opacity: 0, x: 40, rotate: 5 },
        visible: {
            opacity: 1,
            x: 0,
            rotate: 0,
            transition: {
                duration: 0.7,
                ease: [0.23, 1, 0.32, 1],
            },
        },
    },

    // Scale and fade with rotation
    scaleInRotate: {
        hidden: { opacity: 0, scale: 0.3, rotate: -180 },
        visible: {
            opacity: 1,
            scale: 1,
            rotate: 0,
            transition: {
                duration: 0.8,
                ease: [0.34, 1.56, 0.64, 1],
            },
        },
    },

    // Pop in effect
    popIn: {
        hidden: { opacity: 0, scale: 0 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1],
            },
        },
    },

    // Smooth slide up
    slideUp: {
        hidden: { opacity: 0, y: 60 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.7,
                ease: [0.23, 1, 0.32, 1],
            },
        },
    },

    // Blur and fade in
    blurIn: {
        hidden: { opacity: 0, filter: "blur(10px)" },
        visible: {
            opacity: 1,
            filter: "blur(0px)",
            transition: {
                duration: 0.8,
                ease: "easeOut",
            },
        },
    },
};

// ============================================================================
// HOVER VARIANTS - Interactive effects
// ============================================================================

export const hoverVariants = {
    // Lift up on hover
    liftUp: {
        hover: {
            y: -12,
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
        },
    },

    // Scale and glow
    scaleGlow: {
        hover: {
            scale: 1.05,
            boxShadow: "0 0 30px rgba(201, 168, 76, 0.4)",
            transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
        },
    },

    // Rotate and scale
    rotateScale: {
        hover: {
            scale: 1.08,
            rotate: 3,
            transition: { duration: 0.3, ease: "easeOut" },
        },
    },

    // Slide right
    slideRight: {
        hover: {
            x: 8,
            transition: { duration: 0.3, ease: "easeOut" },
        },
    },

    // Pulse effect
    pulse: {
        hover: {
            boxShadow: [
                "0 0 0 0px rgba(201, 168, 76, 0.7)",
                "0 0 0 10px rgba(201, 168, 76, 0)",
            ],
            transition: { duration: 0.6 },
        },
    },

    // Rotate icon
    rotateIcon: {
        hover: {
            rotate: 360,
            transition: { duration: 0.6, ease: "easeInOut" },
        },
    },
};

// ============================================================================
// PAGE TRANSITION VARIANTS - Screen entrance/exit
// ============================================================================

export const pageVariants = {
    // Fade in page
    fadeIn: {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.6 },
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.4 },
        },
    },

    // Slide in from bottom
    slideInUp: {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] },
        },
        exit: {
            opacity: 0,
            y: 40,
            transition: { duration: 0.4 },
        },
    },

    // Scale and fade
    scaleIn: {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.4 },
        },
    },
};

// ============================================================================
// TEXT ANIMATION VARIANTS - Typography animations
// ============================================================================

export const textVariants = {
    // Character by character reveal
    charReveal: {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1,
            },
        },
    },

    // Letter animation
    letter: {
        hidden: { opacity: 0, y: 20, rotate: -10 },
        visible: {
            opacity: 1,
            y: 0,
            rotate: 0,
            transition: { duration: 0.4, ease: "easeOut" },
        },
    },

    // Word reveal with underline
    wordReveal: {
        hidden: { opacity: 0, width: 0 },
        visible: {
            opacity: 1,
            width: "auto",
            transition: { duration: 0.6, ease: "easeOut" },
        },
    },

    // Gradient text animation
    gradientShift: {
        animate: {
            backgroundPosition: ["0%", "100%"],
            transition: {
                duration: 3,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse",
            },
        },
    },
};

// ============================================================================
// ELEMENT ANIMATION FUNCTIONS - Ready-to-use configurations
// ============================================================================

/**
 * Creates a staggered container with fade-in animation
 */
export function createStaggerContainer(staggerDelay = 0.12, childDelay = 0.05) {
    return {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: staggerDelay,
                delayChildren: childDelay,
            },
        },
    };
}

/**
 * Creates a card animation with multiple stages
 */
export function createCardAnimation(duration = 0.6) {
    return {
        hidden: { opacity: 0, y: 40, scale: 0.9 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration,
                ease: [0.23, 1, 0.32, 1],
            },
        },
        hover: {
            y: -8,
            scale: 1.02,
            transition: { duration: 0.3 },
        },
        tap: {
            scale: 0.98,
            transition: { duration: 0.1 },
        },
    };
}

/**
 * Creates a button animation
 */
export function createButtonAnimation() {
    return {
        rest: { scale: 1 },
        hover: {
            scale: 1.05,
            transition: { duration: 0.2 },
        },
        tap: {
            scale: 0.95,
            transition: { duration: 0.1 },
        },
    };
}

/**
 * Creates an image animation with zoom effect
 */
export function createImageAnimation(duration = 0.8) {
    return {
        hidden: { opacity: 0, scale: 0.8, filter: "blur(10px)" },
        visible: {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            transition: {
                duration,
                ease: [0.23, 1, 0.32, 1],
            },
        },
        hover: {
            scale: 1.08,
            transition: { duration: 0.4 },
        },
    };
}

/**
 * Creates a reveal animation for text
 */
export function createTextReveal(duration = 0.6) {
    return {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration, ease: "easeOut" },
        },
    };
}

/**
 * Creates a rotate animation
 */
export function createRotateAnimation(duration = 20) {
    return {
        animate: {
            rotate: 360,
            transition: {
                duration,
                ease: "linear",
                repeat: Infinity,
            },
        },
    };
}

/**
 * Creates a float/bounce animation
 */
export function createFloatAnimation(distance = 10, duration = 3) {
    return {
        animate: {
            y: [0, -distance, 0],
            transition: {
                duration,
                ease: "easeInOut",
                repeat: Infinity,
            },
        },
    };
}

/**
 * Creates a glow animation
 */
export function createGlowAnimation(duration = 2) {
    return {
        animate: {
            boxShadow: [
                "0 0 20px rgba(201, 168, 76, 0.3)",
                "0 0 40px rgba(201, 168, 76, 0.6)",
                "0 0 20px rgba(201, 168, 76, 0.3)",
            ],
            transition: {
                duration,
                ease: "easeInOut",
                repeat: Infinity,
            },
        },
    };
}

/**
 * Creates a parallax scroll animation
 */
export function createParallax(offset = 50) {
    return {
        initial: { y: 0 },
        whileInView: { y: -offset },
        transition: { duration: 0.6 },
    };
}

/**
 * Creates a reveal animation from left
 */
export function createRevealFromLeft(duration = 0.7) {
    return {
        hidden: { opacity: 0, x: -100 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration, ease: [0.23, 1, 0.32, 1] },
        },
    };
}

/**
 * Creates a reveal animation from right
 */
export function createRevealFromRight(duration = 0.7) {
    return {
        hidden: { opacity: 0, x: 100 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration, ease: [0.23, 1, 0.32, 1] },
        },
    };
}

// ============================================================================
// CSS CLASSES FOR WILL-CHANGE (performance optimization)
// ============================================================================

export const cssClasses = {
    animate: "will-change-transform will-change-opacity",
    animateHeavy: "will-change-transform will-change-opacity will-change-filter",
};

// ============================================================================
// VIEWPORT SETTINGS - For scroll-triggered animations
// ============================================================================

export const viewportSettings = {
    // Triggers animation when 20% of element is visible
    eager: { once: true, amount: 0.2 },

    // Triggers when 50% is visible
    normal: { once: true, amount: 0.5 },

    // Triggers when fully visible
    strict: { once: true, amount: 0.9 },

    // Triggers multiple times as you scroll
    repeated: { amount: 0.3 },
};

export default {
    easing,
    containerVariants,
    itemVariants,
    hoverVariants,
    pageVariants,
    textVariants,
    viewportSettings,
};
