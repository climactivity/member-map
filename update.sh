#!/bin/bash

# arg fiddling
[[ -f .env ]] && source .env
[[ $1 == '-h' ]] && echo "./update-sh [wp-host]" 
[[ -n $1 ]] && WP_HOST=$1

scp -r static $WP_HOST:/web