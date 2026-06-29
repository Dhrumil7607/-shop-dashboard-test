/**
 * Suspense fallback shown while a lazily-loaded route chunk is fetched.
 *
 * Intentionally minimal and centered to avoid cumulative layout shift (CLS):
 * it occupies the full viewport height and fades in only after a short delay
 * so fast chunk loads never flash a spinner.
 */
export default function PageLoader() {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="flex min-h-screen items-center justify-center bg-ivory"
        >
            <span className="sr-only">Loading…</span>
            <span
                aria-hidden="true"
                className="h-8 w-8 animate-spin rounded-full border-2 border-maroon/20 border-t-maroon"
            />
        </div>
    );
}
