#!/bin/bash
set -ex

cd web
yarn build
cd ..

go build -o one-api

pid=$(ps aux|grep port=3001|grep -v grep|awk '{print $2}')
if [[ "$pid" != "" ]]
then 
kill -9 $pid
fi

nohup ./one-api --port=3001 &

