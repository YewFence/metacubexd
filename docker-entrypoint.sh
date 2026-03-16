#!/bin/sh

# Map DEFAULT_BACKEND_URL to Nuxt runtime config env var
# Nuxt automatically maps NUXT_PUBLIC_* env vars to runtimeConfig.public.*
export NUXT_PUBLIC_DEFAULT_BACKEND_URL="${DEFAULT_BACKEND_URL:-}"

# Map MIHOMO_CONFIG_PATH to Nuxt runtime config env var
# 用于拉取远程配置时持久化到磁盘
export NUXT_MIHOMO_CONFIG_PATH="${MIHOMO_CONFIG_PATH:-}"

# Also write config.js for backward compatibility (static hosting fallback)
# Use node + single-quoted script to avoid any shell interpolation
node -e '
  var url = process.env.DEFAULT_BACKEND_URL || "";
  var js = "window.__METACUBEXD_CONFIG__ = { defaultBackendURL: " + JSON.stringify(url) + " }";
  require("fs").writeFileSync("/app/.output/public/config.js", js);
'

# Start Node.js server
exec node /app/.output/server/index.mjs
