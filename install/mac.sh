#!/usr/bin/env bash
if [ "$EUID" -eq 0 ]
then
	export _HOME=/usr/local/KwRuntime
	export _APPS=/Applications
else
	export _HOME="$HOME/KwRuntime"
	export _APPS="$HOME/Applications"
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
runtimeversion="16.14.0"
md5=""

case $(uname -m) in
    x86_64) nodeurl="https://k.m3ga.work/raw/kodhe/kawix/id55/.name./node.tar.gz" ;;
    aarch64) nodeurl="https://k.m3ga.work/raw/kodhe/kawix/id56/.name./node.tar.gz" ;;
	arm64) nodeurl="https://k.m3ga.work/raw/kodhe/kawix/id56/.name./node.tar.gz" ;;
    *)   echo "Unable to determine system architecture."; exit 1 ;;
esac


case $(uname -m) in
    x86_64) arch="x64" ; md5="e3528fe884431d460f67931b18924a29" ;;
    aarch64) arch="arm64" ; md5="ce9d7e6799678e8996e049e6289d5c2c" ;;
	arm64) arch="arm64" ; md5="ce9d7e6799678e8996e049e6289d5c2c" ;;
esac


function installNode(){
	curl -L $nodeurl -o "$_HOME/bin/node.tar.gz"
    cd "$_HOME/bin"
	# extract node 
	tar xvf node.tar.gz
	chmod +x */*/node
	ln -sf ./$arch/$runtimeversion/node node
	rm node.tar.gz
}

function checkmd5() {
  echo "Checking if node is correctly installed"

  md5_to_test=$1
  md5_from_file=$(md5 "$2" | cut -d "=" -f2 | cut -d " " -f2)
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


curl -L "https://raw.githubusercontent.com/kwruntime/distribution/main/core/dist/kwruntime.js" -o "$_HOME/src/kwruntime.js"
curl -L "https://raw.githubusercontent.com/kwruntime/distribution/main/core/dist/Kawix.js" -o "$_HOME/src/Kawix.js"
curl -L "https://raw.githubusercontent.com/kwruntime/distribution/main/core/mac/KwRuntime.app.tar.gz" -o "$_HOME/src/KwRuntime.app.tar.gz"

cd $_APPS
tar xvf "$_HOME/src/KwRuntime.app.tar.gz"


"$_HOME/bin/node" "$_HOME/src/kwruntime.js" --self-install 
