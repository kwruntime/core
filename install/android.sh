#!/usr/bin/env bash
if [ "$EUID" -eq 0 ]
then
	export _HOME=/usr/local/KwRuntime
else
	export _HOME="$HOME/KwRuntime"
fi

if [[ ! -e "$_HOME" ]]; then
    mkdir "$_HOME"
fi

if [[ ! -e "$_HOME/bin" ]]; then
    mkdir "$_HOME/bin"
fi
mkdir -p "$_HOME/src"

pkg install -y curl nodejs-lts

curl -L "https://raw.githubusercontent.com/kwruntime/core/main/dist/kwruntime.js" -o "$_HOME/src/kwruntime.js"
curl -L "https://raw.githubusercontent.com/kwruntime/core/main/dist/Kawix.js" -o "$_HOME/src/Kawix.js"

node "$_HOME/src/kwruntime.js" --self-install 
