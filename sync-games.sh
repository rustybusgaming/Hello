#!/bin/bash
set -e

echo "Starting game synchronization..."

mkdir -p public/gameports
mkdir -p public/quasar

# 1. Download Gameports if not present or incomplete
if [ ! -d "public/gameports/milkman karlson" ] && [ ! -d "public/gameports/Build" ]; then
  echo "Downloading Gameports collection..."
  rm -rf public/gameports_temp
  git clone --depth 1 https://github.com/aukak/gameports.git public/gameports_temp
  rm -rf public/gameports_temp/.git
  cp -r public/gameports_temp/* public/gameports/ 2>/dev/null || true
  rm -rf public/gameports_temp
fi

# 2. Download Quasar if not present or incomplete
if [ ! -d "public/quasar/storage" ] || [ ! -d "public/quasar/img" ]; then
  echo "Downloading Quasar library..."
  rm -rf temp_quasar
  git clone --depth 1 https://github.com/slqntdevss/quasar.git temp_quasar
  mkdir -p public/quasar/storage
  mkdir -p public/quasar/img
  if [ -d "temp_quasar/public/assets/storage" ]; then
    cp -r temp_quasar/public/assets/storage/* public/quasar/storage/ 2>/dev/null || true
  fi
  if [ -d "temp_quasar/public/img" ]; then
    cp -r temp_quasar/public/img/* public/quasar/img/ 2>/dev/null || true
  fi
  rm -rf temp_quasar
fi

echo "Game synchronization completed successfully!"
