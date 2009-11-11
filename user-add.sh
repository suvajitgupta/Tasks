#!/bin/sh

printUsage() {
  echo "Usage: user-add.sh <full name> <login name> <password> <role>"
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
PASSWORD=$3
ROLE=$4

if [ -z "$LOGIN_NAME" ]; then
  echo "ERROR: Login name cannot be blank."
  printUsage
  exit 1
fi

if [ "$ROLE" != "Developer" ] && [ "$ROLE" != "Manager" ] && [ "$ROLE" != "Tester" ]; then
  echo "ERROR: Role must be one of [ \"Developer\" | \"Manager\" | \"Tester\" ]"
  exit 1
fi

# Print the user info.
echo "Creating new user..."; echo
echo "Full name: $FULL_NAME"
echo "Login name: $LOGIN_NAME"
echo "Password: <hidden>"
echo "Role: $ROLE"
