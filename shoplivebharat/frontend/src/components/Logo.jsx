import { Link } from "react-router-dom";

export default function Logo({ className = "" }) {
    return (
        <Link 
            to="/" 
            className={`group transition-transform hover:scale-105 ${className}`}
        >
            {/* Logo - Proper proportions */}
            <div className="flex items-center gap-2">
                {/* Shopping Bag Icon */}
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                    {/* Bag handle */}
                    <path d="M 12 10 Q 12 3 24 3 Q 36 3 36 10" stroke="#0a0a0a" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    {/* Bag body */}
                    <rect x="10" y="10" width="28" height="32" rx="2" stroke="#0a0a0a" strokeWidth="2" fill="none" strokeLinejoin="round"/>
                    {/* Play button - orange */}
                    <polygon points="24,18 24,30 34,24" fill="#FF9500"/>
                </svg>
                
                {/* Text Logo */}
                <div className="flex items-baseline gap-0">
                    <span className="font-serif text-xl font-normal text-espresso leading-none">Shop</span>
                    <span className="font-serif text-xl font-normal text-maroon leading-none">Live</span>
                    <span className="font-serif text-xl font-normal leading-none" style={{color: '#1B5E20'}}>Bharat</span>
                </div>
            </div>
        </Link>
    );
}
