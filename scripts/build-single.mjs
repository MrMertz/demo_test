// Samler det byggede spil (dist/) til én selvstændig HTML-fil: dist/dyrenes-madmission.html
// JS, CSS og skrifttyper indlejres, så filen kan åbnes eller deles uden en webserver.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist'
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const jsPath = html.match(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/)[1]
const cssPath = html.match(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/)[1]

let css = readFileSync(join(dist, cssPath), 'utf8')
// Skrifttyper som data-URI'er (kun latin-varianterne bruges til dansk)
css = css.replace(/url\(\.\/([^)]+\.woff2)\)/g, (_, f) => {
  if (!/latin/.test(f)) return 'url(data:font/woff2;base64,)'
  return `url(data:font/woff2;base64,${readFileSync(join(dist, 'assets', f)).toString('base64')})`
})
const js = readFileSync(join(dist, jsPath), 'utf8').replace(/<\/script/gi, '<\\/script')
const favicon = readFileSync(join(dist, 'favicon.svg')).toString('base64')

const out = `<meta charset="utf-8">
<title>Dyrenes Madmission</title>
<meta name="theme-color" content="#7cc4e8">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${favicon}">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`
writeFileSync(join(dist, 'dyrenes-madmission.html'), out)
console.log(`dist/dyrenes-madmission.html (${(out.length / 1024).toFixed(0)} KB)`)
