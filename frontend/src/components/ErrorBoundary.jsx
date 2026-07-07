import { Component } from "react";

/**
 * App-wide error boundary.
 *
 * Catches render-time errors in the React tree and shows a branded,
 * recoverable fallback instead of a blank white screen. Errors are
 * reported to PostHog (if present) for monitoring.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // Report to monitoring if available; never throw from here.
        try {
            if (typeof window !== "undefined" && window.posthog?.captureException) {
                window.posthog.captureException(error, {
                    componentStack: info?.componentStack,
                });
            }
        } catch (_) {
            /* no-op */
        }
        // Keep a console trace for local debugging.
        // eslint-disable-next-line no-console
        console.error("Render error captured by ErrorBoundary:", error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        if (this.props.fallback) {
            return this.props.fallback({
                error: this.state.error,
                reset: this.handleReset,
            });
        }

        return (
            <div
                role="alert"
                aria-live="assertive"
                className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ivory px-6 text-center text-espresso"
            >
                <div className="max-w-md space-y-4">
                    <h1 className="font-serif text-3xl">Something went wrong</h1>
                    <p className="text-espresso/70">
                        An unexpected error interrupted this page. You can try again, or
                        head back to the homepage.
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={this.handleReset}
                            className="rounded-full bg-maroon px-6 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-maroon/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
                        >
                            Try again
                        </button>
                        <a
                            href="/"
                            className="rounded-full border border-espresso/20 px-6 py-2.5 text-sm font-medium text-espresso transition-colors hover:bg-espresso/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso"
                        >
                            Go home
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}
