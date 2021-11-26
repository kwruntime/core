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

nodeurl=""
arch=""
runtimeversion="16.13.0"
md5=""

case $(uname -m) in
    i386)   echo "Not supported"; exit 1 ;;
    i686)   echo "Not supported"; exit 1 ;;
    x86_64) nodeurl="https://k.m3ga.work/raw/kodhe/kawix/id47/.name./node.tar.xz" ;;
    armv7l) nodeurl="https://k.m3ga.work/raw/kodhe/kawix/id45/.name./node.tar.xz" ;;
    aarch64) nodeurl="https://k.m3ga.work/raw/kodhe/kawix/id46/.name./node.tar.xz" ;;
    *)   echo "Unable to determine system architecture."; exit 1 ;;
esac


case $(uname -m) in
    x86_64) arch="x64" ; md5="5d3805ac6c6183a17ca76f0034d7924a" ;;
    armv7l) arch="arm" ; md5="c2444e79aaa6d6aa031568225a1b904d" ;;
    aarch64) arch="arm64" ; md5="e1da6fdd3ae4cfe8af0c70dcd7d829e0" ;;
esac


function installNode(){
	curl -L $nodeurl -o "$_HOME/bin/node.tar.xz"
    cd "$_HOME/bin"
	# extract node 
	tar xvf node.tar.xz
	chmod +x */*/node
	ln -sf ./$arch/$runtimeversion/node node
	rm node.tar.xz
}

function checkmd5() {
  echo "Checking if node is correctly installed"

  md5_to_test=$1
  md5_from_file=$(md5sum "$2" | cut -d " " -f1)
  md5_results="Input: $md5_to_test\nFile:  $md5_from_file"
  if [[ $md5_to_test == $md5_from_file ]]
    then
      echo "Node is yet installed"
    else
      installNode
  fi
}


cd "$_HOME/bin"
nodefile="./$arch/$runtimeversion/node"
if test -f "$nodefile"; then
    checkmd5 $md5 $nodefile
else
    installNode
fi


curl -L "https://raw.githubusercontent.com/kwruntime/core/main/dist/kwruntime.js" -o "$_HOME/src/kwruntime.js"
curl -L "https://raw.githubusercontent.com/kwruntime/core/main/dist/Kawix.js" -o "$_HOME/src/Kawix.js"

"$_HOME/bin/node" "$_HOME/src/kwruntime.js" --self-install 
