export default function FieldError({ error }) {
    if (!error) return null;
    return (
        <p role="alert" className="flex items-center gap-1 mt-1.5 text-xs text-red-600 font-medium">
            <span>⚠</span> {error}
        </p>
    );
}
