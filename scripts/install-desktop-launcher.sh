#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DESKTOP_DIR="${HOME}/.local/share/applications"
BIN_DIR="${HOME}/.local/bin"
DESKTOP_FILE="${DESKTOP_DIR}/verdicta.desktop"
CLI_LINK="${BIN_DIR}/verdicta"
LAUNCH_SCRIPT="${REPO_ROOT}/scripts/launch-verdicta.sh"

mkdir -p "${DESKTOP_DIR}" "${BIN_DIR}"

cat >"${DESKTOP_FILE}" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Verdicta
Comment=Launch the local Verdicta Electron app
Exec=${LAUNCH_SCRIPT}
Path=${REPO_ROOT}
Terminal=false
Categories=Office;Development;
StartupNotify=true
X-GNOME-UsesNotifications=true
EOF

chmod +x "${LAUNCH_SCRIPT}"
chmod +x "${DESKTOP_FILE}"
ln -sfn "${LAUNCH_SCRIPT}" "${CLI_LINK}"

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "${DESKTOP_DIR}" >/dev/null 2>&1 || true
fi

echo "Installed launcher:"
echo "  Desktop entry: ${DESKTOP_FILE}"
echo "  CLI shortcut:  ${CLI_LINK}"
