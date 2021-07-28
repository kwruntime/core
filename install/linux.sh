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

curl -L  "https://k.m3ga.work/raw/kodhe/kawix/\$2/.name./14.17.3-x64.tar.xz" -o "$_HOME/bin/node.tar.xz"
curl -L "https://raw.githubusercontent.com/kwruntime/core/main/dist/kwruntime.js" -o "$_HOME/src/kwruntime.js"
curl -L "https://raw.githubusercontent.com/kwruntime/core/main/dist/Kawix.js" -o "$_HOME/src/Kawix.js"

cd "$_HOME/bin"
# extract node 
tar xvf node.tar.xz
chmod +x x64/14.17.3/node
ln -sf ./x64/14.17.3/node node
rm node.tar.xz



"$_HOME/bin/node" "$_HOME/src/kwruntime.js" --self-install 