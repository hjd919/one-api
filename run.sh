#!/bin/bash
set -ex

if [[ "$1" == "" ]]
then
  cd web
  yarn build
  cd ..
fi

go build -o one-api

pid=$(ps aux|grep port=3001|grep -v grep|awk '{print $2}')
if [[ "$pid" != "" ]]
then 
kill -9 $pid
fi

# 需要先执行如下创建db的sql语句
# CREATE DATABASE `oneapi` CHARACTER SET utf8 COLLATE utf8_general_ci;
export SQL_DSN="root:Aa112211@tcp(localhost:3306)/oneapi?charset=utf8&parseTime=True&loc=Local&timeout=10s&readTimeout=30s&writeTimeout=60s"

nohup ./one-api --port=3001 &

