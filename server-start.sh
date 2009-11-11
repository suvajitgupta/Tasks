#!/bin/sh
# A simple shell script that launches the Persevere server.
# Author: Sean Eidemiller

TASKS_DIR=`pwd`
MODE=prod
PORT=8088
OUT_FILE="$TASKS_DIR/server.out"
ERR_FILE="$TASKS_DIR/server.err"

if [ "$1" = "-t" ]; then
  MODE=test
  PORT=8089
  OUT_FILE="$TASKS_DIR/server-test.out"
  ERR_FILE="$TASKS_DIR/server-test.err"
fi

SERVER_DIR="tasks-server/$MODE"

if [ -f /bin/echo ]; then
  ECHO="/bin/echo"
else
  ECHO="echo"
fi

"$ECHO" -n "Starting Persevere [$MODE] server... "

if [ ! -d "$SERVER_DIR" ]; then
  echo "FAILED"
  echo "Unable to locate $SERVER_DIR directory."
  exit 1
fi

cd "$SERVER_DIR"

"$TASKS_DIR"/persevere/bin/persvr -p "$PORT" --base-uri /tasks-server > "$OUT_FILE" 2> "$ERR_FILE" &

if [ "$?" -eq 0 ]; then
  echo "OK"
  echo "Server PID: $!"
else
  echo "FAILED"
  cat "$ERR_FILE"
  rm "$ERR_FILE"
  exit 1
fi

if [ -e "$ERR_FILE" ]; then
  rm "$ERR_FILE"
fi

cd "$TASKS_DIR"
