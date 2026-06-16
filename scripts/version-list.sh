#!/usr/bin/env bash
# List public workspace packages as name@version, one per line.
pnpm ls -r --depth -1 --json | node -e "
process.stdin.setEncoding('utf8');
let d='';
process.stdin.on('data', c => d += c);
process.stdin.on('end', () =>
  JSON.parse(d).forEach(p => p.private || console.log(p.name + '@' + p.version))
)
"
