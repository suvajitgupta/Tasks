#!/bin/sh
# A simple shell script that launches the Persevere server.
# Author: Sean Eidemiller

DIR=`pwd`

if [ -f /bin/echo ]; then
  ECHO="/bin/echo"
else
  ECHO="echo"
fi

"$ECHO" -n "Starting Persevere server... "

if [ ! -d tasks-server ]; then
  echo "FAILED"
  echo "Unable to locate tasks-server directory."
  exit 1
fi

cd tasks-server

"$DIR"/persevere/bin/persvr -p 8088 --base-uri /tasks-server > "$DIR"/server.out 2> server.err &

if [ "$?" -eq 0 ]; then
  echo "OK"
  echo "Server PID: $!"
else
  echo "FAILED"
  cat server.err
  rm server.err
  exit 1
fi

if [ -f server.err ]; then
  rm server.err
fi

cd "$DIR"
