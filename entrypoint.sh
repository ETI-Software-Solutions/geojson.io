#!/bin/sh

NGINX_BASE_DIR="/usr/share/nginx/html"

SUBPATH="${SUBPATH:-/}"

if [ "$SUBPATH" != "/" ]; then
  TARGET_DIR="${NGINX_BASE_DIR}${SUBPATH}"
  
  mkdir -p "$TARGET_DIR"
  mv /tmp/dist "$TARGET_DIR"

  sed -i "s|dist/bundle|${SUBPATH}/dist/bundle|" "$NGINX_BASE_DIR/index.html"
else
  mv /tmp/dist "$NGINX_BASE_DIR"
fi