#!/bin/sh

printUsage() {
  echo "Usage: user-add.sh <full name> <login name> <role> <host:port>"
}

# Do some sanity checking on the arguments.
if [ "$1" = "-h" ]; then
  printUsage
  exit
elif [ $# -ne 4 ]; then
  echo "ERROR: Incorrect number of arguments."
  printUsage
  exit 1
fi

FULL_NAME=$1
LOGIN_NAME=$2
ROLE=$3
HOST_PORT=$4

if [ -z "$HOST_PORT" ]; then
  echo "ERROR: Must specify hostname and port (host:port)."
  printUsage
  exit 1
fi

if [ -z "$LOGIN_NAME" ]; then
  echo "ERROR: Login name cannot be blank."
  printUsage
  exit 1
fi

if [ "$ROLE" != "Manager" ] && [ "$ROLE" != "Developer" ] && [ "$ROLE" != "Tester" ] && [ "$ROLE" != "Guest" ]; then
  echo "ERROR: Role must be one of [ \"Manager\" | \"Developer\" | \"Tester\"  | \"Guest\" ]"
  exit 1
fi

# Prompt for password.
/bin/echo -n "Enter password: "
stty -echo
read PASSWORD
stty echo

echo

/bin/echo -n "Verify password: "
stty -echo
read PASSWORD_VERIFY
stty echo

echo; echo

if [ "$PASSWORD" != "$PASSWORD_VERIFY" ]; then
  echo "ERROR: Passwords do not match."
  exit 1
fi

# Hash the password (SHA1)
SHA1_BIN=`which sha1sum`

if [ $? -ne 0 ]; then
  OPENSSL_BIN=`which openssl`
  if [ $? -ne 0 ]; then
    echo "ERROR: Unable to generate SHA1 hash of password (missing binary)."
    exit 1
  else
    SHA1_BIN="$OPENSSL_BIN sha1" 
  fi
fi

PASSWORD_HASH=`/bin/echo -n $PASSWORD | $SHA1_BIN | awk '{print $1}'`

# Build the JSON and POST to the server using cURL.
JSON="{name:'$FULL_NAME',loginName:'$LOGIN_NAME',role:'_$ROLE',password:'$PASSWORD_HASH'}"

/bin/echo -n "Creating new user... "

curl -k -X POST -H "Content-Type: application/json" -d "$JSON" \
  "http://$HOST_PORT/tasks-server/user" >/dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "OK"; echo
else
  echo "Failed"; echo
  exit 1
fi
