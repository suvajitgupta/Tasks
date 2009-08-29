#!/bin/sh
DIR=`pwd`
cd tasks-server
"$DIR"/persevere/bin/persvr -p 8088 --base-uri /tasks-server > "$DIR"/server.out 2>&1 &
cd "$DIR"
