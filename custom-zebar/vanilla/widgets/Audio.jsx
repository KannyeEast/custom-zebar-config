// Imports
import React, { useState } from "https://esm.sh/react@18?dev";
import { GetUsage, GetIcon } from "../utils.jsx";

// Audio
export function Audio({ output, iconSize }) {
    const [isOpen, setIsOpen] = useState(false);

    const volume = output?.defaultPlaybackDevice?.volume;

    return (
        <div className="bg">
            {/* get Audio Icon */}
            <button
                title="Audio"
                key={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
                {GetIcon("audio", "png", volume, [5, 33, 66], iconSize)}
            </button>
            {/* cool GIF */}
            <span className={`audio ${isOpen ? "open" : ""} hover-details label`}>
                <img
                    src="../icons/dance-00.gif"
                    className="i-sys"
                    width={iconSize * 2}
                    height={iconSize * 2}
                    alt="Dance"
                />
            </span>
            {/* Display Audio Volume */}
            <span className={`gray ${GetUsage(volume, true)} media`}>
                [{String(volume).padStart(2, '0')}%]
            </span>
        </div>
    )
}
