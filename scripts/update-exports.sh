#!/usr/bin/env bash

set -eEu -o pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

cd "$DIR/.."

EXPORTS=$(find "./src/" -name *.js \
	| grep -v 'node_modules' \
	| grep -v '.test.js' \
	| grep -v '/testing/' \
	| grep -vE '/_[^/]+/' \
	| jq --raw-input --slurp '.
			| split("\n") | .[:-1]
			| map(.
				| (if .|endswith("/index.js") then .[6:-9] else .[6:-3] end) as $key
				| {("./" + $key): (.)}
			)
			| add
		')

cp package.json package.json~
jq ".exports=${EXPORTS}" < package.json~ > package.json
