//*******************//
//** get Functions **//
//*******************//

// Change the color of a class depending on usage
export function GetUsage(percent, invert = false) {
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
export function GetIcon(name, fileType = "png", percent, threshold = [5, 45, 75], iconSize = 48) {
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
    
