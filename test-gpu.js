const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
function detect() {
    const platform = process.platform;
    if (platform === 'darwin') {
        try {
            const out = execSync("system_profiler SPDisplaysDataType", { encoding: "utf8" });
            const match = out.match(/Chipset Model:\s*(.*)/);
            return { name: match ? match[1].trim() : "Apple GPU", supportsGpuRuntime: true };
        } catch { }
    } else if (platform === 'win32') {
        try {
            const out = execSync("wmic path win32_VideoController get name", { encoding: "utf8" });
            const lines = out.split('\n').map(l => l.trim()).filter(l => l && l !== "Name");
            if (lines.length > 0) return { name: lines[0], supportsGpuRuntime: true };
        } catch { }
    } else if (platform === 'linux') {
        try {
            const out = execSync("lspci -mm | grep -i vga", { encoding: "utf8" });
            const match = out.split('\n')[0].match(/"([^"]*)"\s*"([^"]*)"/);
            if (match) return { name: `${match[1]} ${match[2]}`, supportsGpuRuntime: true };
        } catch { }
    }
    return { name: null, supportsGpuRuntime: false };
}
console.log(detect());
