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
            <div className="ovr">
                <button
                    title={output.glazewm?.isPaused ? "Unlock" : "Lock"}
                    className={`lock ${output.glazewm?.isPaused ? 'locked' : 'unlocked'}`}
                    onClick={() => output.glazewm.runCommand("wm-toggle-pause")}
                ></button>
            </div>
            {/* Date */}
            <div className="bg">
                <span className="media">
                    {output.date?.formatted}
                </span>
            </div>
            {/* Workspaces */}
            {output.glazewm && (
                <Workspaces output={output.glazewm} iconSize={iconSize} />
            )}
            {/* Current Tiling Direction */} 
            <div className="bg">
                <button
                    title={String(output.glazewm?.tilingDirection).charAt(0).toUpperCase() + output.glazewm?.tilingDirection.slice(1)}
                    className={`${output.glazewm?.tilingDirection === "horizontal" ? "" : "rot"}`}
                    onClick={() => output.glazewm.runCommand("toggle-tiling-direction")}
                >
                    <img
                        src="./icons/tiling-00.png"
                        className={`i`}
                        width={iconSize * 0.75}
                        height={iconSize * 0.75}
                        alt={output.glazewm?.tilingDirection}
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
            {/* Custom Shortcuts */}
            {output.glazewm && (
                <ShortcutTray glaze={output.glazewm} iconSize={iconSize} />
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
                <Disk output={output.disk} iconSize={iconSize} />
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

  //*****************************//
 //** Simple Render Functions **//
//*****************************//

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
        <div className="bg">
            {sortedAll.map((ws) => {
                const isCurrent = currentSet.has(ws.name);
                const isActive = ws.displayName === displayedWorkspaceName;
                
                return (
                    <span key={ws.id ?? ws.name}>
                        <button 
                            title={isActive ? (ws.name + ": " +  ws.displayName) : ("Focus " + ws.name + ": " +  ws.displayName)}
                            onClick={() => isActive ? "" : output.runCommand(`focus --workspace ${ws.name}`)
                        }
                        >
                            {isCurrent ? (
                                /* Active Screen */
                                <span className={isActive ? "focused" : "unfocused"}>
                                    {ws.name + ": "}
                                    {isActive ?
                                        (
                                            <>
                                                ◎
                                                <Taskbar ws={ws} />
                                            </>
                                        ) : (
                                            "●"
                                        )}
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
            <span className="media">
                {"ㅤ|ㅤ" + displayedWorkspaceName}
            </span>
        </div>
    );
}

// Get Active Workspace Programs
function Taskbar({ ws }) {
    if (!ws.isDisplayed) return null;

    return (
        <span>
            {ws.children.map((child) => {
                if (child.type === "window") {
                    return (
                        <span title={child.processName} className="taskbar">
                            ☐
                        </span>
                    )
                } else if (child.type === "split") {
                    child.children.map((subChild) => {
                        <Taskbar ws={subChild} />;
                    })
                }
                return null
            })}
        </span>
    )
}

      //--------------//
     //--- Center ---//
    //--------------//

// Window Title
function Window({ output }) {
    const procName = output.focusedContainer.processName ?? "Unknown";
    const cleaned = String(procName.replace(/\.exe$/i, '').trim()).charAt(0).toUpperCase() + procName.slice(1);
    
    return (
        <div className="bg">
            <span title={output.focusedContainer.title}>
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
        <div className="bg">
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
                            alt="Previous"
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
                            alt={isPlaying ? "Pause" : "Play"}
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
                            alt="Skip"
                        />
                    </button>
                    <span title={title + " — " + artist} className="media ">
                        {"ㅤ" + title}
                        {"ㅤ—ㅤ" + (artist != null ? artist : "Unknown Artist")}
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
    const adjIconSize = iconSize * 0.9;

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
        <div className="bg">
            <button
                key={isOpen}
                title={isOpen ? "Close" : "Open"}
                onClick={() => setIsOpen(!isOpen)}
            >
                <img
                    src={"./icons/open-00.png"}
                    className={`${isOpen ? "open" : ""} i`}
                    width={iconSize}
                    height={iconSize}
                    alt="Systray"
                />
            </button>

            <span className={`${isOpen ? "open" : ""} hover-details`}>
                {output.icons
                    .filter(icon => icon.iconHash !== "54b3f1b8992816cb") /* Ignore Audio Tray */
                    .sort((a, b) => a.iconHash.localeCompare(b.iconHash))
                    .map((icon) => (
                        <button
                            key={icon.id}
                            title={icon.tooltip}
                            onMouseDown={(e) => handleClick(e, icon)}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <img
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

// Custom Shortcuts
function ShortcutTray({ glaze, iconSize }) {
    const [isOpen, setIsOpen] = useState(false);

    const shortcuts = [
        {
            id: "taskmgr",
            title: "Task Manager",
            icon: "./icons/taskmgr-00.png",
            command: "shell-exec taskmgr"
        },
        {
            id: "project",
            title: "New Project",
            icon: "./icons/proj-00.png",
            command: "shell-exec D:\\00_projects\\_create_project\\main.exe"
        },
    ];

    return (
        <div className="bg">
            <button
                title="Shortcuts"
                onClick={() => setIsOpen(!isOpen)}
            >
                <img
                    src={`./icons/folder-${isOpen ? "01" : "00"}.png`}
                    className="i"
                    width={iconSize}
                    height={iconSize}
                    alt="Shortcuts"
                />
            </button>

            <span className={`${isOpen ? "open" : ""} hover-details`}>
                {shortcuts.map((item) => (
                    <button
                        key={item.id}
                        title={item.title}
                        onClick={() => glaze.runCommand(item.command)}
                    >
                        <img
                            src={item.icon}
                            className="i"
                            width={iconSize}
                            height={iconSize}
                            alt={item.title}
                        />
                    </button>
                ))}
            </span>
        </div>
    );
}


// Audio
function Audio({ output, iconSize }) {
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
            {/* Display Audio Volume */}
            <span className={`gray ${GetUsage(volume, true)} media`}>
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
        <div className="bg">
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
                                    alt="Ethernet"
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
                                    alt={`Wifi ${strength}`}
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
function Disk({ output, iconSize }) {
    const [isOpen, setIsOpen] = useState(false);
    
    const disks = output.disks ?? [];

    return (
        <div className="bg">
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
                    alt="Disk"
                />
            </button>
            {/* Display all Disk Drives on System */}
            <span className="media">
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
        <div className="bg">
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
                    alt="CPU"
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
            <span className={`${GetUsage(usage)} media`}>
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
        <div className="bg">
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
                    alt="RAM"
                />
            </button>
            <span className={`${isOpen ? "open" : ""} hover-details`}>
                [{usedMemory.toFixed(1)}G/{totalMemory.toFixed(1)}G]
            </span>
            <span className={`${GetUsage(usage)} media`}>
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
            alt={name}
        ></img>
    )
}
    

