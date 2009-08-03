#!/bin/sh
PID=`ps aux | grep java | grep persevere | grep -v grep | awk '{print $2}'`
if [ ! -z "$PID" ]; then
  kill "$PID"
fi
