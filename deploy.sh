#!/usr/bin/env sh

hugo --minify && rsync -e 'ssh -ax -p 2222' --archive --delete --verbose --compress --ignore-existing --human-readable --exclude '.DS_Store' --exclude 'reunion' public/ eto.xdeb.net:/var/www/customers/frjo/web/
