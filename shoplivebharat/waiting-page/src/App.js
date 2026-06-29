import "@/App.css";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import Landing from "@/pages/Landing";

function App() {
    return (
        <div className="App">
            <Landing />
            <Toaster
                position="top-center"
                richColors={false}
                toastOptions={{
                    style: {
                        background: "rgba(255,255,255,0.85)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid #E8E4DF",
                        color: "#2C241B",
                        fontFamily: "Outfit, sans-serif",
                        letterSpacing: "0.02em",
                    },
                }}
            />
        </div>
    );
}

export default App;
