// Imports
import React, { useState, useEffect } from "https://esm.sh/react@18?dev";
import { createRoot } from "https://esm.sh/react-dom@18/client?dev";
import * as zebar from "https://esm.sh/zebar@3.0";

// Set the needed Providers 
const providers = zebar.createProviderGroup({
    date:       { type: "date", formatting: "dd.MM — HH:mm" },
    glazewm:    { type: "glazewm" },
    media:      { type: "media" },
    systray:    { type: "systray" },
    audio:      { type: "audio" },
    network:    { type: "network", refreshInterval: "2000" },
    disk:       { type: "disk" },
    cpu:        { type: "cpu", refreshInterval: "2000" },
    memory:     { type: "memory", refreshInterval: "4000" },
});

createRoot(document.getElementById("root")).render(<App />);

function App() {
    const [output, setOutput] = useState(providers.outputMap);
    const iconSize = 16;

    useEffect(() => {
        providers.onOutput(() => setOutput(providers.outputMap));
    }, []);

    return (
        <div className="app">
            <LeftPanel output={output} iconSize={iconSize}/>
            <CenterPanel output={output} iconSize={iconSize} />
            <RightPanel output={output} iconSize={iconSize} />
        </div>
    );
}

  //********************//
 //** Base Structure **//
//********************//

// Left Panel
function LeftPanel({output, iconSize}) {
    return (
        <div className="left">
            {/* Lock */}
            <div className="ovr fg">
                <button
                    title={output.glazewm?.isPaused ? "Unlock" : "Lock"}
                    className={`lock ${output.glazewm?.isPaused ? 'paused' : 'active'}`}
                    onClick={() => output.glazewm.runCommand("wm-toggle-pause")}
                ></button>
            </div>
            {/* Date */}
            <div className="fg">
                {output.date?.formatted}
            </div>
            {/* Workspaces */}
            {output.glazewm && (
                <Workspaces output={output.glazewm} iconSize={iconSize} />
            )}
            {/* Current Tiling Direction */} 
            <div className="ovr til fg">
                <button
                    title={String(output.glazewm?.tilingDirection).charAt(0).toUpperCase() + output.glazewm?.tilingDirection.slice(1)}
                    className={output.glazewm?.tilingDirection === "horizontal" ? "" : "rot"}
                    onClick={() => output.glazewm.runCommand("toggle-tiling-direction")}
                >
                    <img
                        src="./icons/tiling-00.png"
                        className={`ovr i`}
                        width={iconSize * 0.75}
                        height={iconSize * 0.75}
                    />
                </button>
            </div>
        </div>
    )
}

// Center Panel
function CenterPanel ({ output, iconSize }) {
    const isFocused = output.glazewm?.focusedMonitor === output.glazewm?.currentMonitor;
    
    return (
        <div className="center">
            {isFocused ? (
                /* Active Window */
                output.glazewm && <Window output={output.glazewm} />
            ) : (
                /* Media Session */
                output.media && <Media output={output.media} iconSize={iconSize} />
            )}
        </div>
    );
}

// Right Panel
function RightPanel({ output, iconSize }) {
    return (
        <div className="right">
            {/* System Tray */}
            {output.systray && (
                <Systray output={output.systray} iconSize={iconSize} />
            )}
            {/* Audio */}
            {output.audio && (
                <Audio output={output.audio} iconSize={iconSize} />
            )}
            {/* Network */}
            {output.network && (
                <Network output={output.network} iconSize={iconSize} />
            )}
            {/* Disks */}
            {output.disk && (
                <Disk output={output.disk} iconSize={iconSize} glaze={output.glazewm} />
            )}
            {/* CPU */}
            {output && (
                <CPU output={output} iconSize={iconSize} />
            )}
            {/* RAM */}
            {output.memory && (
                <RAM output={output.memory} iconSize={iconSize} />
            )}
        </div>
    );
}

  //**********************//
 //** Render Functions **//
//**********************//

      //------------//
     //--- Left ---//
    //------------//

// Workspaces
function Workspaces({ output, iconSize }) {
    const allWorkspaces = output.allWorkspaces ?? [];
    const currentWorkspaces = output.currentWorkspaces ?? [];
    const displayedWorkspaceName = output.displayedWorkspace?.displayName ?? "Unknown";

    // Create a set of active Workspace names for lookup
    const currentSet = new Set(currentWorkspaces.map(ws => ws.name));

    // Sort allWorkspaces 
    const sortedAll = [...allWorkspaces].sort((a, b) => Number(a.name) - Number(b.name));
    
    return (
        <div className="fg">
            {sortedAll.map((ws) => {
                const isCurrent = currentSet.has(ws.name);
                const isActive = ws.displayName === displayedWorkspaceName;
                
                return (
                    <span key={ws.id ?? ws.name}>
                        <button 
                            title={"Focus " + ws.name + ": " +  ws.displayName}
                            onClick={() => 
                                output.runCommand(`focus --workspace ${ws.name}`)
                        }
                        >
                            {isCurrent ? (
                                /* Active Screen */
                                <span className={isActive ? "focused" : "unfocused"}>
                                    {ws.name + ": "} {isActive ? '◎' : '●'}
                                </span>
                            ) : (
                                /* Inactive Screen */
                                <span className="unfocused">
                                    ◌
                                </span>
                            )}
                        </button>
                    </span>
                );
            })}
            {/* Active Workspace Title per Screen */}
            <span className="overflow">
                {"ㅤ|ㅤ" + displayedWorkspaceName}
            </span>
        </div>
    );
}

      //--------------//
     //--- Center ---//
    //--------------//

// Window Title
function Window({ output }) {
    const procName = output.focusedContainer.processName ?? "Unknown";
    const cleaned = String(procName.replace(/\.exe$/i, '').trim()).charAt(0).toUpperCase() + procName.slice(1);
    
    return (
        <div className="fg">
            <span title={output.focusedContainer.title} className="overflow">
                {cleaned}
            </span>
        </div>
    )
}

// Media Session
function Media({ output, iconSize }) {
    const session = output.currentSession;
    const { title = 'Unknown Track', artist = 'Unknown Artist', isPlaying } = session || {};
    
    const adjIconSize = iconSize * 0.85;
    
    return (
        <div className="fg">
            {session ? (
                <>
                    <button
                        key="prev"
                        title="Previous"
                        onClick={() => output.previous()}
                    >
                        <img
                            src={"./icons/skip-00.png"}
                            className="media i rot"
                            width={adjIconSize}
                            height={adjIconSize}
                        />
                    </button>
                    <button
                        key={isPlaying}
                        title={isPlaying ? 'Pause' : 'Play'}
                        onClick={() => output.togglePlayPause()}
                    >
                        <img
                            src={`./icons/play-${isPlaying ? "01" : "00"}.png`}
                            className="media i"
                            width={adjIconSize}
                            height={adjIconSize}
                        />
                    </button>
                    <button
                        key="next"
                        title="Next"
                        onClick={() => output.next()}
                    >
                        <img
                            src={"./icons/skip-00.png"}
                            className="media i"
                            width={adjIconSize}
                            height={adjIconSize}
                        />
                    </button>
                    <span title={title + " — " + artist}>
                        <span className="media overflow">
                            {"ㅤ" + title} 
                        </span>
                        <span className="media overflow">
                             {"ㅤ—ㅤ" + artist}
                        </span>
                    </span>
                </>
                ) : (
                    <span>
                        No Media playing
                    </span>
                )}
        </div>
    )
}

      //-------------//
     //--- Right ---//
    //-------------//

// System Tray
function Systray({ output, iconSize }) {
    const [isOpen, setIsOpen] = useState(false);
    const adjIconSize = iconSize * 0.85;
    
    // Click Event
    const handleClick = (e, icon) => {
        e.preventDefault();
        if (e.shiftKey) return;
        
        switch (e.button) {
            case 0:
                output.onLeftClick(icon.id)
                break;
            case 1:
                output.onMiddleClick(icon.id)
                break;
            case 2:
                output.onRightClick(icon.id)
                break;
        }
    }
    
    return (
        <div className="til fg">
            <button
                title={isOpen ? "Close" : "Open"}
                key={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
                <img
                    key={isOpen}
                    src={"./icons/open-00.png"}
                    className={`${isOpen ? "open" : ""} ovr i `}
                    width={iconSize}
                    height={iconSize}
                    alt="status"
                />
            </button>
            
            <span className={`${isOpen ? "open" : ""} sys overflow`}>
                {output.icons
                    .filter(icon => icon.iconHash !== "54b3f1b8992816cb") /* Ignore Audio Tray */
                    .sort((a, b) => a.tooltip.localeCompare(b.tooltip))
                    .map((icon) => (
                    <button 
                        title={icon.tooltip}
                        onMouseDown={(e) => handleClick(e, icon)}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <img
                            key={icon.id}
                            src={icon.iconUrl}
                            className="i-sys"
                            width={adjIconSize}
                            height={adjIconSize}
                            alt={icon.tooltip}
                        />
                    </button>
                ))}
            </span>
        </div>
    )
}

// Audio
function Audio({ output, iconSize }) {
    const [isOpen, setIsOpen] = useState(false);
    
    const volume = output?.defaultPlaybackDevice?.volume;
    
    return (
        <div className="fg">
            {/* get Audio Icon */}
            <button
                title="Audio"
                key={isOpen} 
                onClick={() => setIsOpen(!isOpen)}
            >
                {GetIcon("audio", "png", volume, [5, 33, 66], iconSize)}
            </button>
            {/* Display Audio Volume */}
            <span className={`gray ${GetUsage(volume, true)}`}>
                [{String(volume).padStart(2, '0')}%]
            </span>
        </div>
    )
}

// Network
function Network({ output, iconSize }) {
    const [isOpen, setIsOpen] = useState(false);
    
    const netType = output?.defaultInterface?.type?.toLowerCase() ?? "";
    const strength = output?.defaultGateway?.signalStrength;
    
    const traffic = output?.traffic;
    const down = traffic?.received;
    const up = traffic?.transmitted;

    return (
        <div className="fg">
            {/* get Network Icon */}
            <button
                title="Network"
                key={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
            {(() => {
                switch (netType) {
                    case "ethernet":
                        return (
                            <span>
                                <img 
                                    src="./icons/eth-00.png" 
                                    className="i" 
                                    width={iconSize} 
                                    height={iconSize}
                                />
                            </span>
                        );
                    case "wifi":
                        return (
                            <span>
                                {GetIcon("wifi", "png", strength, [5, 45, 75], iconSize)}
                            </span>
                        )
                    default:
                        return (
                            <span>
                                <img
                                    src="./icons/wifi-00.png"
                                    className="i"
                                    width={iconSize}
                                    height={iconSize}
                                />
                            </span>
                        );
                }
            })()}
            </button>

            {/* Received & Transmitted Data */}
            <span className={`${isOpen ? "open" : ""} hover-details label`} >
                <span className="net-down">
                    ↓ {down ? `${down.iecValue.toFixed(1)} ${down.iecUnit}/s` : "--"} 
                </span>
                <span className="net-up">
                    ↑ {up ? `${up.iecValue.toFixed(1)} ${up.iecUnit}/s` : "--"}
                </span>
            </span>
        </div>
    );
}

// Disks
function Disk({ output, iconSize, glaze }) {
    const [isOpen, setIsOpen] = useState(false);
    
    const disks = output.disks ?? [];

    return (
        <div className="fg">
            {/* get Disk Icon */}
            <button
                title="Drives"
                key={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
                <img
                    src="./icons/disk-00.png"
                    className="i"
                    width={iconSize}
                    height={iconSize}
                />
            </button>
            {/* Display all Disk Drives on System */}
            <span>
                {disks.map((disk) => {
                    const total = disk.totalSpace.bytes;
                    const available = disk.availableSpace.bytes;
                    const percent = Math.floor(((total - available) / total) * 100);

                    const usedGB = (total - available) / (1024 ** 3);
                    const totalGB = total / (1024 ** 3);

                    const label = disk.mountPoint.replace(/\\$/, '');

                    return (
                        <span>
                            <span>
                                {label}
                            </span>
                            <span className={`${isOpen ? "open" : ""} hover-details`}>
                                [{usedGB.toFixed(1)}G/{totalGB.toFixed(1)}G]
                            </span>
                            <span className={`disk ${GetUsage(percent)}`}>
                                [{String(percent).padStart(2, '0')}%]
                            </span>
                        </span>
                    );
                })}
            </span>
        </div>
    );
}

// CPU
function CPU({ output, iconSize }) {
    const [isOpen, setIsOpen] = useState(false);
    
    const usage = Math.floor(output.cpu?.usage);
    
    return (
        <div className="fg">
            <button
                title="CPU"
                key={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
                <img 
                    src="./icons/cpu-00.png" 
                    className="i" 
                    width={iconSize} 
                    height={iconSize}
                />
            </button>
            <span className={`${isOpen ? "open" : ""} hover-details label`} >
                <span> 
                    {output.cpu?.physicalCoreCount} Cores
                </span>
                <span>
                    {output.cpu?.logicalCoreCount} Threads
                </span>
            </span>
            <span className={GetUsage(usage)}>
                [{String(usage).padStart(2, '0')}%]
            </span>
        </div>
    )
}

// RAM
function RAM({ output, iconSize }) {
    const [isOpen, setIsOpen] = useState(false);
    
    const usage = Math.floor(output.usage);
    const usedMemory  = (output.usedMemory ?? 0) / (1024 ** 3);
    const totalMemory = (output.totalMemory ?? 0) / (1024 ** 3);
    
    return (
        <div className="fg">
            <button
                title="RAM"
                key={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
                <img
                    src="./icons/ram-00.png"
                    className="i"
                    width={iconSize}
                    height={iconSize}
                />
            </button>
            <span className={`${isOpen ? "open" : ""} hover-details`}>
                [{usedMemory.toFixed(1)}G/{totalMemory.toFixed(1)}G]
            </span>
            <span className={GetUsage(usage)}>
                [{String(usage).padStart(2, '0')}%]
            </span>
        </div>
    )
}


  //*******************//
 //** get Functions **//
//*******************//

// Change the color of a class depending on usage
function GetUsage(percent, invert = false) {
    let load = percent;
    
    if(invert) {
        load = 100 - percent;
    }
    
    if (load < 30) return "load low";
    else if (load < 65) return "load medium";
    else if (load < 90) return "load high";
    return "load extreme";
}


// Generic getIcon Function 
// Requires 3 different Icon states along with 1 fallback Icon - w/ correct naming convention
function GetIcon(name, fileType = "png", percent, threshold = [5, 45, 75], iconSize = 48) {
    const index =
        percent >= threshold[2] ? 3 : 
            percent >= threshold[1] ? 2 :
                percent >= threshold[0] ? 1 : 0;
    
    const iconSuffix = ["00", "01", "02", "03"][index];
    
    return(
        <img
            src={`./icons/${name}-${iconSuffix}.${fileType}`}
            className="i"
            width={iconSize}
            height={iconSize}
        ></img>
    )
}
    

