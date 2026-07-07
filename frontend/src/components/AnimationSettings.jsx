import { motion } from "framer-motion";
import { useState, useEffect } from "react";

/**
 * Animation Settings Manager
 * Allows admins to control global animation settings
 */

export function useAnimationSettings() {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem("slb_animation_settings");
        return saved
            ? JSON.parse(saved)
            : {
                  enableAnimations: true,
                  enableFestivalDecorations: true,
                  animationSpeed: "normal", // "fast" | "normal" | "slow"
                  enableConfetti: true,
                  enableToasts: true,
              };
    });

    const updateSettings = (newSettings) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem("slb_animation_settings", JSON.stringify(updated));
    };

    return { settings, updateSettings };
}

// Admin Panel Component
export function AdminAnimationSettings() {
    const { settings, updateSettings } = useAnimationSettings();
    const [isOpen, setIsOpen] = useState(false);

    const speedMultipliers = {
        fast: 0.5,
        normal: 1,
        slow: 1.5,
    };

    return (
        <motion.div
            className="fixed bottom-6 right-6 z-40"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full bg-gold text-white shadow-lg flex items-center justify-center hover:bg-gold/90 transition"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <span className="text-xl">🎬</span>
            </motion.button>

            {/* Settings Panel */}
            {isOpen && (
                <motion.div
                    className="absolute bottom-20 right-0 bg-white rounded-lg shadow-2xl p-6 w-72 border border-stone/10"
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{ duration: 0.3 }}
                >
                    <h3 className="font-semibold text-espresso mb-4 text-lg">
                        Animation Settings
                    </h3>

                    <div className="space-y-4">
                        {/* Enable/Disable Animations */}
                        <SettingToggle
                            label="Enable Animations"
                            value={settings.enableAnimations}
                            onChange={(value) =>
                                updateSettings({ enableAnimations: value })
                            }
                        />

                        {/* Festival Decorations */}
                        <SettingToggle
                            label="Festival Decorations"
                            value={settings.enableFestivalDecorations}
                            onChange={(value) =>
                                updateSettings({
                                    enableFestivalDecorations: value,
                                })
                            }
                        />

                        {/* Animation Speed */}
                        <div>
                            <label className="text-sm font-medium text-espresso mb-2 block">
                                Animation Speed
                            </label>
                            <div className="flex gap-2">
                                {Object.keys(speedMultipliers).map((speed) => (
                                    <motion.button
                                        key={speed}
                                        onClick={() =>
                                            updateSettings({
                                                animationSpeed: speed,
                                            })
                                        }
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition capitalize ${
                                            settings.animationSpeed === speed
                                                ? "bg-gold text-white"
                                                : "bg-stone/10 text-stone hover:bg-stone/20"
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {speed}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Confetti Animation */}
                        <SettingToggle
                            label="Confetti Effects"
                            value={settings.enableConfetti}
                            onChange={(value) =>
                                updateSettings({ enableConfetti: value })
                            }
                        />

                        {/* Toast Notifications */}
                        <SettingToggle
                            label="Toast Notifications"
                            value={settings.enableToasts}
                            onChange={(value) =>
                                updateSettings({ enableToasts: value })
                            }
                        />
                    </div>

                    {/* Info */}
                    <motion.p
                        className="text-xs text-stone mt-4 pt-4 border-t border-stone/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        Settings saved locally. Refresh page to see changes.
                    </motion.p>

                    {/* Close Button */}
                    <motion.button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-3 right-3 text-stone hover:text-espresso transition"
                        whileHover={{ scale: 1.2 }}
                    >
                        ✕
                    </motion.button>
                </motion.div>
            )}
        </motion.div>
    );
}

// Toggle Switch Component
function SettingToggle({ label, value, onChange }) {
    return (
        <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-espresso">{label}</label>
            <motion.button
                onClick={() => onChange(!value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    value ? "bg-gold" : "bg-stone/20"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <motion.span
                    className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm"
                    animate={{ x: value ? 20 : 2 }}
                    transition={{ type: "spring", stiffness: 500 }}
                />
            </motion.button>
        </div>
    );
}

/**
 * Hook to get animation duration based on settings
 */
export function useAnimationDuration(defaultDuration = 0.6) {
    const { settings } = useAnimationSettings();

    if (!settings.enableAnimations) {
        return 0.01; // Instant
    }

    const multiplier = {
        fast: 0.5,
        normal: 1,
        slow: 1.5,
    }[settings.animationSpeed] || 1;

    return defaultDuration * multiplier;
}

/**
 * Conditional animation wrapper
 */
export function ConditionalAnimation({
    children,
    initialState,
    animateState,
    disabledState,
}) {
    const { settings } = useAnimationSettings();

    if (!settings.enableAnimations) {
        return children({ ...disabledState });
    }

    return children({ ...animateState });
}

/**
 * Context for animation settings (for passing down to deeply nested components)
 */
import { createContext, useContext } from "react";

const AnimationSettingsContext = createContext();

export function AnimationSettingsProvider({ children }) {
    const animationSettings = useAnimationSettings();

    return (
        <AnimationSettingsContext.Provider value={animationSettings}>
            {children}
        </AnimationSettingsContext.Provider>
    );
}

export function useAnimationSettingsContext() {
    const context = useContext(AnimationSettingsContext);
    if (!context) {
        throw new Error(
            "useAnimationSettingsContext must be used within AnimationSettingsProvider"
        );
    }
    return context;
}

/**
 * Example usage in App.jsx:
 * 
 * import { AdminAnimationSettings, AnimationSettingsProvider } from "@/components/AnimationSettings";
 * 
 * function App() {
 *     return (
 *         <AnimationSettingsProvider>
 *             <BrowserRouter>
 *                 {isAdmin && <AdminAnimationSettings />}
 *                 {/* Rest of app */}
 *             </BrowserRouter>
 *         </AnimationSettingsProvider>
 *     );
 * }
 */
