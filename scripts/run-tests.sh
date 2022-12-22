#!/usr/bin/env bash

set -eEu -o pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

cd "$DIR/.."

shopt -s globstar nullglob
node node_modules/@kmamal/testing src/**/*.test.js
