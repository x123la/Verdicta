const os = require('os');
const { execSync } = require('child_process');

console.log("CPUs:", os.cpus().map(c => `Model: ${c.model}, Speed: ${c.speed}MHz`));

try {
  console.log("LSPCI VGA:", execSync("lspci -vmm | awk 'BEGIN{RS=\"\\n\\n\"} /VGA/ {print}'").toString());
} catch(e) {}

try {
  console.log("SENSORS:", execSync("sensors").toString());
} catch(e) {}
