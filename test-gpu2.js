const fs = require('fs');
const round1 = (v) => v == null ? null : Math.round(v * 10) / 10;
const readText = (c) => { try { return fs.readFileSync(c, 'utf8').trim() } catch { return null; }};
function detectAmdLinux() {
    for (let i = 0; i < 2; i++) {
        const basePath = `/sys/class/drm/card${i}/device`;
        const vendor = readText(`${basePath}/vendor`);
        if (vendor && vendor.toLowerCase() === '0x1002') {
            const vramTotalText = readText(`${basePath}/mem_info_vram_total`);
            const vramUsedText = readText(`${basePath}/mem_info_vram_used`);
            const busyText = readText(`${basePath}/gpu_busy_percent`);
            
            return {
                name: "AMD Radeon GPU (Linux)",
                totalVramGb: vramTotalText ? round1(Number(vramTotalText) / (1024 ** 3)) : null,
                usedVramGb: vramUsedText ? round1(Number(vramUsedText) / (1024 ** 3)) : null,
                utilPercent: busyText ? Number(busyText) : null,
                supportsGpuRuntime: true
            };
        }
    }
    return null;
}
console.log(detectAmdLinux());
