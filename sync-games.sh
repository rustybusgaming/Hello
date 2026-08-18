#!/bin/bash
set -e

echo "Starting game synchronization..."

mkdir -p public/gameports
mkdir -p public/quasar

# 1. Download Gameports if the folder is still empty
if [ -z "$(ls -A public/gameports 2>/dev/null)" ]; then
  echo "Downloading Gameports collection..."
  rm -rf public/gameports_temp
  git clone --depth 1 https://github.com/aukak/gameports.git public/gameports_temp
  trap 'rm -rf public/gameports_temp' EXIT
  rm -rf public/gameports_temp/.git
  cp -r public/gameports_temp/* public/gameports/ 2>/dev/null || true
  rm -rf public/gameports_temp
  trap - EXIT
fi

# 2. Download Quasar if either of its asset folders is missing or empty
if [ -z "$(ls -A public/quasar/storage 2>/dev/null)" ] || [ -z "$(ls -A public/quasar/img 2>/dev/null)" ]; then
  echo "Downloading Quasar library..."
  rm -rf temp_quasar
  git clone --depth 1 https://github.com/slqntdevss/quasar.git temp_quasar
  trap 'rm -rf temp_quasar' EXIT
  mkdir -p public/quasar/storage
  mkdir -p public/quasar/img
  if [ -d "temp_quasar/public/assets/storage" ]; then
    cp -r temp_quasar/public/assets/storage/* public/quasar/storage/ 2>/dev/null || true
  fi
  if [ -d "temp_quasar/public/img" ]; then
    cp -r temp_quasar/public/img/* public/quasar/img/ 2>/dev/null || true
  fi
  rm -rf temp_quasar
  trap - EXIT
fi

echo "Game synchronization completed successfully!"
