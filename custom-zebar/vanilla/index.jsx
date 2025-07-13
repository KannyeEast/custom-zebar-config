// Imports
import React, { useState, useEffect } from "https://esm.sh/react@18?dev";
import { createRoot } from "https://esm.sh/react-dom@18/client?dev";
import * as zebar from "https://esm.sh/zebar@2";

// Set the needed Providers 
const providers = zebar.createProviderGroup({
    date:       { type: "date", formatting: "dd.MM — HH:mm" },
    glazewm:    { type: "glazewm" },
    media:      { type: "media" },
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
            <LeftPanel output={output} />
            <CenterPanel output={output} iconSize={iconSize} />
            <RightPanel output={output} iconSize={iconSize} />
        </div>
    );
}

  //********************//
 //** Base Structure **//
//********************//

// Left Panel
function LeftPanel({output}) {
    return (
        <div className="left">
            {/* Lock */}
            <div className="ovr fg">
                <button
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
                <Workspaces output={output.glazewm} />
            )}

        </div>
    )
}

// Center Panel
function CenterPanel ({ output, iconSize }) {
    const focusedMonitor = output.glazewm?.focusedMonitor;
    const currMonitor = output.glazewm?.currentMonitor;
    
    return (
        <div className="center">
            {(() => {
                if (focusedMonitor === currMonitor) {
                    {/* Window Name */}
                    return ( 
                        output.glazewm && (
                            <Window output={output.glazewm} />
                        )
                    )
                }
                {/* Media Session */}
                return (
                    output.media && (
                        <Media output={output.media} iconSize={iconSize} />
                    )
                )
            })()}
        </div>
    )
}

// Right Panel
function RightPanel({ output, iconSize }) {
    return (
        <div className="right">
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
                <Disk output={output.disk} iconSize={iconSize} />
            )}
            {/* CPU */}
            {output.cpu && (
                <CPU output={output.cpu} iconSize={iconSize} />
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

//--- Left ---//
// Workspaces
function Workspaces({ output }) {
    const allWorkspaces = output.allWorkspaces ?? [];
    const currentWorkspaces = output.currentWorkspaces ?? [];
    const displayedWorkspaceName = output.displayedWorkspace?.displayName ?? "Unknown";

    // Create a set of active Workspace names for lookup
    const currentSet = new Set(currentWorkspaces.map(ws => ws.name));

    // Sort allWorkspaces 
    const sortedAll = [...allWorkspaces].sort((a, b) => Number(a.name) - Number(b.name));
    
    return (
        <div className="fg"className="fg">
            {sortedAll.map((ws) => {
                const isCurrent = currentSet.has(ws.name);
                const isActive = ws.displayName === displayedWorkspaceName;
            
                {/* Active Screen */}
                if (isCurrent) {
                    return (
                        <span>
                            <button 
                                key={ws.id ?? ws.name} 
                                onClick={() => 
                                    output.glazewm.runCommand(`focus --workspace ${ws.name}`)
                            }
                            >
                                <span className={isActive ? "focused" : "unfocused"}>
                                    {ws.name + ": "} {isActive ? '◎' : '●'}
                                </span>
                            </button>
                        </span>
                    );
                }
            
                {/* Inactive Screen */}
                return (
                    <span>
                        <button 
                            key={ws.id ?? ws.name} 
                            onClick={() => 
                                output.glazewm.runCommand(`focus --workspace ${ws.name}`)
                        }
                        >
                            <span className="unfocused">
                                ◌
                            </span>
                        </button>
                    </span>
                );
            })}
            {/* Active Workspace Title per Screen */}
            <span className="overflow">
                {"| " + displayedWorkspaceName}
            </span>
        </div>
    );
}

//--- Center ---//
// Window Title
function Window({ output }) {
    const procName = output.focusedContainer.processName ?? "Unknown";
    const cleaned = String(procName.replace(/\.exe$/i, '').trim()).charAt(0).toUpperCase() + procName.slice(1);
    
    return (
        <div className="fg">
            <span className="overflow">
                {cleaned}
            </span>
        </div>
    )
}

// Media Session
function Media({ output, iconSize }) {
    const session = output.currentSession;
    const { title = 'Unknown Track', artist = 'Unknown Artist', isPlaying } = session || {};
    
    return (
        <div className="fg">
            <span className="overflow">
                {`${title} — ${artist}`}
            </span>
            <button
                key={isPlaying}
                onClick={() => output.togglePlayPause()}
            >
                <img
                    src={`./icons/play-${isPlaying ? "00" : "01"}.png`}
                    className="media i"
                    width={iconSize}
                    height={iconSize}
                />
            </button>
        </div>
    )
}

//--- Right ---//
// Audio
function Audio({ output, iconSize }) {
    const volume = output?.defaultPlaybackDevice?.volume;
    
    return (
        <div className="fg">
            {/* get Audio Icon */}
            <span>
                {GetIcon("audio", "png", volume, [5, 33, 66], iconSize)}
            </span>
            {/* Display Audio Volume */}
            <span className={`gray ${GetUsage(volume, true)}`}>
                [{String(volume).padStart(2, '0')}%]
            </span>
        </div>
    )
}

// Network
function Network({ output, iconSize }) {
    const netType = output?.defaultInterface?.type?.toLowerCase() ?? "";
    const strength = output?.defaultGateway?.signalStrength;
    
    const traffic = output?.traffic;
    const down = traffic?.received;
    const up = traffic?.transmitted;

    return (
        <div className="fg">
            {/* get Network Icon */}
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

            {/* Received & Transmitted Data */}
            <span className="label hover-details">
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
function Disk({ output, iconSize }) {
    const disks = output.disks ?? [];

    return (
        <div className="fg">
            {/* get Disk Icon */}
            <span>
                <img
                    src="./icons/disk-00.png"
                    className="i"
                    width={iconSize}
                    height={iconSize}
                />
            </span>
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
                        <span className="disk">
                            <span>{label}</span>
                            <span className="hover-details">
                                [{usedGB.toFixed(1)}G/{totalGB.toFixed(1)}G]
                            </span>
                            <span className={GetUsage(percent)}>
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
    const usage = Math.floor(output.usage);
    
    return (
        <div className="fg">
            <span>
                <img 
                    src="./icons/cpu-00.png" 
                    className="i" 
                    width={iconSize} 
                    height={iconSize}
                />
            </span>
            <span className={GetUsage(usage)}>
                [{String(usage).padStart(2, '0')}%]
            </span>
        </div>
    )
}

// RAM
function RAM({ output, iconSize }) {
    const usage = Math.floor(output.usage);
    const usedMemory  = (output.usedMemory ?? 0) / (1024 ** 3);
    const totalMemory = (output.totalMemory ?? 0) / (1024 ** 3);
    
    return (
        <div className="fg">
            <span>
                <img
                    src="./icons/ram-00.png"
                    className="i"
                    width={iconSize}
                    height={iconSize}
                />
            </span>
            <span className="hover-details">
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
    
    if (load < 30) return "load-low";
    else if (load < 65) return "load-medium";
    else if (load < 90) return "load-high";
    return "load-extreme";
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
    

