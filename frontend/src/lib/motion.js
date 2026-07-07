/**
 * Reusable motion variants library.
 * All animations use GPU-accelerated properties (transform + opacity only).
 * Components import specific variants they need.
 */

// ─── Spring presets ────────────────────────────────────────────
export const spring = {
    snappy:  { type: "spring", stiffness: 500, damping: 30, mass: 0.8 },
    smooth:  { type: "spring", stiffness: 300, damping: 28, mass: 1 },
    bouncy:  { type: "spring", stiffness: 400, damping: 20, mass: 0.9 },
    gentle:  { type: "spring", stiffness: 200, damping: 30, mass: 1 },
    slow:    { type: "spring", stiffness: 120, damping: 28, mass: 1.2 },
};

export const ease = {
    out:    [0.16, 1, 0.3, 1],
    smooth: [0.22, 0.61, 0.36, 1],
    spring: [0.34, 1.56, 0.64, 1],
};

// ─── Page / route transition ───────────────────────────────────
export const pageVariants = {
    initial:  { opacity: 0, y: 12, filter: "blur(4px)" },
    enter:    { opacity: 1, y: 0,  filter: "blur(0px)",  transition: { duration: 0.45, ease: ease.out } },
    exit:     { opacity: 0, y: -8, filter: "blur(2px)",  transition: { duration: 0.25, ease: ease.smooth } },
};

// ─── Fade up (general content blocks) ─────────────────────────
export const fadeUp = {
    hidden:  { opacity: 0, y: 24, scale: 0.98 },
    visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.55, ease: ease.out } },
};

export const fadeIn = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

// ─── Stagger container ─────────────────────────────────────────
export const staggerContainer = (stagger = 0.07, delay = 0) => ({
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: stagger, delayChildren: delay } },
});

export const staggerItem = {
    hidden:  { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0,  scale: 1,
        transition: { duration: 0.5, ease: ease.out },
    },
};

// ─── Card hover ───────────────────────────────────────────────
export const cardHover = {
    rest:  { y: 0, scale: 1,    boxShadow: "0 2px 8px rgba(44,36,27,0.06)" },
    hover: { y: -6, scale: 1.01, boxShadow: "0 20px 48px rgba(44,36,27,0.14)" },
};
export const cardHoverTransition = { duration: 0.28, ease: ease.smooth };

// ─── Image zoom on card hover ─────────────────────────────────
export const imgZoom = {
    rest:  { scale: 1 },
    hover: { scale: 1.07, transition: { duration: 0.55, ease: ease.smooth } },
};

// ─── Magnetic button ──────────────────────────────────────────
export const magneticBtn = {
    rest:    { scale: 1 },
    hover:   { scale: 1.04 },
    pressed: { scale: 0.97 },
};

// ─── Modal spring ─────────────────────────────────────────────
export const modalBackdrop = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit:    { opacity: 0, transition: { duration: 0.2 } },
};

export const modalPanel = {
    hidden:  { opacity: 0, scale: 0.94, y: 16 },
    visible: { opacity: 1, scale: 1,    y: 0,
        transition: { ...spring.snappy, delay: 0.05 },
    },
    exit:    { opacity: 0, scale: 0.96, y: 8,
        transition: { duration: 0.2, ease: ease.smooth },
    },
};

// ─── Drawer ───────────────────────────────────────────────────
export const drawerRight = {
    hidden:  { x: "100%", opacity: 0 },
    visible: { x: 0,      opacity: 1, transition: { ...spring.smooth } },
    exit:    { x: "100%", opacity: 0, transition: { duration: 0.22, ease: ease.smooth } },
};

// ─── Hero text ────────────────────────────────────────────────
export const heroHeadline = {
    hidden:  { opacity: 0, y: 40, filter: "blur(8px)" },
    visible: { opacity: 1, y: 0,  filter: "blur(0px)",
        transition: { duration: 0.8, ease: ease.out },
    },
};
export const heroSub = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0,
        transition: { duration: 0.6, ease: ease.out, delay: 0.15 },
    },
};
export const heroCta = {
    hidden:  { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0,
        transition: { duration: 0.5, ease: ease.out, delay: 0.3 },
    },
};

// ─── Scroll reveal ────────────────────────────────────────────
export const scrollReveal = {
    hidden:  { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: ease.out } },
};

export const scrollRevealLeft = {
    hidden:  { opacity: 0, x: -24 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: ease.out } },
};

export const scrollRevealRight = {
    hidden:  { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: ease.out } },
};

// ─── Number counter animation ─────────────────────────────────
export const counterItem = {
    hidden:  { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: ease.out } },
};

// ─── Filter sidebar ───────────────────────────────────────────
export const sidebarVariants = {
    hidden:  { opacity: 0, x: -16 },
    visible: { opacity: 1, x: 0,
        transition: { duration: 0.35, ease: ease.out },
    },
};

// ─── Badge pop ────────────────────────────────────────────────
export const badgePop = {
    hidden:  { opacity: 0, scale: 0.75 },
    visible: { opacity: 1, scale: 1,
        transition: { ...spring.bouncy, delay: 0.1 },
    },
};

// ─── Section header reveal ────────────────────────────────────
export const sectionHeader = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0,
        transition: { duration: 0.6, ease: ease.out },
    },
};
