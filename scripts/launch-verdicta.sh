#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LAUNCHER_DIR="${REPO_ROOT}/.launcher"
LOCK_FILE="${LAUNCHER_DIR}/launch.lock"
INSTALL_STAMP="${LAUNCHER_DIR}/install.stamp"
NATIVE_STAMP="${LAUNCHER_DIR}/native.stamp"
BUILD_STAMP="${LAUNCHER_DIR}/build.stamp"
LOG_FILE="${LAUNCHER_DIR}/launch.log"
PROGRESS_PIPE="${LAUNCHER_DIR}/progress.pipe"
GUI_PROGRESS_PID=""
GUI_MODE=0
ELECTRON_STARTUP_WAIT_SECONDS=8
SPINNER_FRAMES=("|" "/" "-" "\\")

mkdir -p "${LAUNCHER_DIR}"

exec 9>"${LOCK_FILE}"
flock -n 9 || {
  if [[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]] && command -v zenity >/dev/null 2>&1; then
    zenity --error --title="Verdicta Already Running" --width=420 --text="Verdicta is already launching or running from this checkout." || true
  elif [[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]] && command -v notify-send >/dev/null 2>&1; then
    notify-send "Verdicta Already Running" "Verdicta is already launching or running from this checkout." || true
  fi
  echo "Verdicta launcher is already running." >&2
  exit 1
}

exec >>"${LOG_FILE}" 2>&1

echo
echo "[$(date --iso-8601=seconds)] Launch requested"

prepend_path() {
  local candidate="$1"
  if [[ -d "${candidate}" && ":${PATH}:" != *":${candidate}:"* ]]; then
    PATH="${candidate}:${PATH}"
  fi
}

bootstrap_runtime_path() {
  prepend_path "${HOME}/.local/bin"
  prepend_path "/usr/local/bin"
  prepend_path "/usr/bin"
  prepend_path "/bin"

  local nvm_bin
  for nvm_bin in "${HOME}"/.nvm/versions/node/*/bin; do
    [[ -d "${nvm_bin}" ]] || continue
    prepend_path "${nvm_bin}"
  done

  export PATH
}

start_progress_ui() {
  if [[ -z "${DISPLAY:-}" && -z "${WAYLAND_DISPLAY:-}" ]]; then
    return
  fi

  if ! command -v zenity >/dev/null 2>&1; then
    return
  fi

  GUI_MODE=1
  rm -f "${PROGRESS_PIPE}"
  mkfifo "${PROGRESS_PIPE}"
  zenity \
    --progress \
    --title="Launching Verdicta" \
    --text="Preparing launcher" \
    --percentage=0 \
    --auto-close \
    --no-cancel \
    --width=420 <"${PROGRESS_PIPE}" &
  GUI_PROGRESS_PID=$!
  exec 8>"${PROGRESS_PIPE}"
  rm -f "${PROGRESS_PIPE}"
}

progress() {
  local percentage="$1"
  local message="$2"
  echo "[$(date --iso-8601=seconds)] ${message}"

  if [[ "${GUI_MODE}" -eq 1 ]]; then
    printf '%s\n# %s\n' "${percentage}" "${message}" >&8 || true
  fi
}

run_step() {
  local start_percentage="$1"
  local end_percentage="$2"
  local title="$3"
  local detail="$4"
  shift 4

  progress "${start_percentage}" "${title} - ${detail}"

  "$@" >>"${LOG_FILE}" 2>&1 &
  local command_pid=$!
  local frame_index=0

  while kill -0 "${command_pid}" 2>/dev/null; do
    if [[ "${GUI_MODE}" -eq 1 ]]; then
      local frame="${SPINNER_FRAMES[$((frame_index % ${#SPINNER_FRAMES[@]}))]}"
      printf '%s\n# %s %s\n%s\n' "${start_percentage}" "${frame}" "${title}" "${detail}" >&8 || true
      frame_index=$((frame_index + 1))
    fi
    sleep 0.15
  done

  if ! wait "${command_pid}"; then
    fail "${title} failed. Check ${LOG_FILE} for details."
  fi

  progress "${end_percentage}" "${title} complete - ${detail}"
}

close_progress_ui() {
  if [[ "${GUI_MODE}" -eq 1 ]]; then
    exec 8>&- || true
    wait "${GUI_PROGRESS_PID}" 2>/dev/null || true
  fi
}

show_error() {
  local message="$1"
  echo "[$(date --iso-8601=seconds)] ERROR: ${message}"

  if [[ "${GUI_MODE}" -eq 1 ]] && command -v zenity >/dev/null 2>&1; then
    close_progress_ui
    zenity --error --title="Verdicta Launch Failed" --width=520 --text="${message}" || true
    return
  fi

  if [[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]] && command -v notify-send >/dev/null 2>&1; then
    notify-send "Verdicta Launch Failed" "${message}" || true
  fi
}

fail() {
  show_error "$1"
  exit 1
}

bootstrap_runtime_path
start_progress_ui
progress 5 "Preparing launch environment"

if ! command -v node >/dev/null 2>&1; then
  fail "Node.js is required to launch Verdicta. Install Node.js 20+ and try again."
fi

run_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    pnpm "$@"
    return
  fi

  if command -v corepack >/dev/null 2>&1; then
    corepack pnpm "$@"
    return
  fi

  fail "pnpm is required to launch Verdicta. Install pnpm 9+ or enable Corepack."
}

needs_install() {
  if [[ ! -d "${REPO_ROOT}/node_modules" ]]; then
    return 0
  fi

  if [[ ! -f "${INSTALL_STAMP}" ]]; then
    return 0
  fi

  local manifests=(
    "${REPO_ROOT}/package.json"
    "${REPO_ROOT}/pnpm-workspace.yaml"
    "${REPO_ROOT}/apps/desktop/package.json"
  )

  if [[ -f "${REPO_ROOT}/pnpm-lock.yaml" ]]; then
    manifests+=("${REPO_ROOT}/pnpm-lock.yaml")
  fi

  local manifest
  for manifest in "${manifests[@]}"; do
    if [[ "${manifest}" -nt "${INSTALL_STAMP}" ]]; then
      return 0
    fi
  done

  return 1
}

needs_build() {
  if [[ ! -f "${REPO_ROOT}/apps/desktop/dist/index.html" ]]; then
    return 0
  fi

  if [[ ! -f "${REPO_ROOT}/apps/desktop/dist-electron/main/main.cjs" ]]; then
    return 0
  fi

  if [[ ! -f "${BUILD_STAMP}" ]]; then
    return 0
  fi

  if find \
    "${REPO_ROOT}/apps/desktop/src" \
    "${REPO_ROOT}/packages" \
    -type f \
    -newer "${BUILD_STAMP}" \
    -print \
    -quit | grep -q .; then
    return 0
  fi

  local build_inputs=(
    "${REPO_ROOT}/package.json"
    "${REPO_ROOT}/apps/desktop/package.json"
    "${REPO_ROOT}/apps/desktop/scripts/build-electron.mjs"
    "${REPO_ROOT}/apps/desktop/tsconfig.json"
    "${REPO_ROOT}/apps/desktop/tsconfig.electron.json"
    "${REPO_ROOT}/apps/desktop/vite.config.ts"
    "${REPO_ROOT}/tsconfig.json"
    "${REPO_ROOT}/tsconfig.base.json"
  )

  local input
  for input in "${build_inputs[@]}"; do
    if [[ "${input}" -nt "${BUILD_STAMP}" ]]; then
      return 0
    fi
  done

  return 1
}

needs_native_deps() {
  if [[ ! -f "${NATIVE_STAMP}" ]]; then
    return 0
  fi

  if [[ "${INSTALL_STAMP}" -nt "${NATIVE_STAMP}" ]]; then
    return 0
  fi

  if [[ "${REPO_ROOT}/apps/desktop/package.json" -nt "${NATIVE_STAMP}" ]]; then
    return 0
  fi

  return 1
}

cd "${REPO_ROOT}"

if needs_install; then
  run_step 18 36 "Installing dependencies" "Resolving the workspace and downloading anything missing." run_pnpm install
  touch "${INSTALL_STAMP}"
fi

if needs_native_deps; then
  run_step 42 58 "Preparing native modules" "Rebuilding Electron-native packages for this machine." run_pnpm --filter @verdicta/desktop run sync:native
  touch "${NATIVE_STAMP}"
fi

if needs_build; then
  run_step 62 86 "Building Verdicta" "Bundling the Electron process and renderer UI." run_pnpm --filter @verdicta/desktop run build:app
  touch "${BUILD_STAMP}"
fi

progress 90 "Starting Verdicta"
run_pnpm --filter @verdicta/desktop exec electron . --no-sandbox >>"${LOG_FILE}" 2>&1 &
ELECTRON_PID=$!

for _ in $(seq 1 "${ELECTRON_STARTUP_WAIT_SECONDS}"); do
  if ! kill -0 "${ELECTRON_PID}" 2>/dev/null; then
    wait "${ELECTRON_PID}" || fail "Verdicta exited during startup. Check ${LOG_FILE} for details."
  fi
  if [[ "${GUI_MODE}" -eq 1 ]]; then
    frame="${SPINNER_FRAMES[$(((_ - 1) % ${#SPINNER_FRAMES[@]}))]}"
    printf '92\n# %s Starting Verdicta\nOpening the application window and loading the workspace.\n' "${frame}" >&8 || true
  fi
  sleep 1
done

progress 100 "Verdicta launched"
close_progress_ui
disown "${ELECTRON_PID}" 2>/dev/null || true
