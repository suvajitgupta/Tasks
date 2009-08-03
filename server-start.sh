#!/bin/sh
DIR=`pwd`
cd tasks-server
"$DIR"/persevere/bin/persvr --base-uri /tasks-server > "$DIR"/server.out 2>&1 &
cd "$DIR"
