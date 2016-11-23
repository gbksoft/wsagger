#!/bin/bash

WSAGGER_SCRIPT_PATH="$(pwd)"

cd /data/home/user/0/wsagger

WSAGGER_SCRIPT_PATH=$WSAGGER_SCRIPT_PATH /usr/bin/node lib/run.js $WSAGGER_SCRIPT_PATH/$1 $2 $3 $4