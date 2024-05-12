#!/bin/sh

set -e

while [ ! -f "yarn.lock" ]; do cd ..; done
cd "wehere-bot"
pwd

mkdir -p "dist/resources/locales"
node "scripts/txt-to-json.mjs" <"src/resources/locales/en.ftl" >"dist/resources/locales/en.json"
stat "dist/resources/locales/en.json"
node "scripts/txt-to-json.mjs" <"src/resources/locales/vi.ftl" >"dist/resources/locales/vi.json"
stat "dist/resources/locales/vi.json"
