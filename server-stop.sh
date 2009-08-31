#!/bin/sh
# A simple script for stopping the Persevere server.
# Author: Sean Eidemiller

if [ -f /bin/echo ]; then
  ECHO="/bin/echo"
else
  ECHO="echo"
fi

"$ECHO" -n "Stopping Persevere server... "

PID=`ps aux | grep java | grep persevere | grep -v grep | awk '{print $2}'`

if [ ! -z "$PID" ]; then
  kill "$PID"
else
  echo "FAILED"
  echo "The server doesn't appear to be running."
  exit 1
fi

if [ "$?" -eq 0 ]; then
  echo "OK"
else
  echo "FAILED"
  echo "Unable to kill server process."
  exit 1
fi
