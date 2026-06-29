import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mime = { '.js': 'text/javascript', '.html': 'text/html' }

const sample = readFileSync(
  'c:/Users/pross/OneDrive/Desktop/рабочие файлы/Сменные задания/РНК/Диаграммы/ФМ_Задания_и_Заказы_ЭСПЦ/03_Фаза_ССЗ.puml',
  'utf8',
)

// Test WITHOUT resolving include (as user might have in studio)
const unresolved = sample

const html = `<!doctype html>
<html><head><meta charset="utf-8"></head><body>
<script src="/public/vendor/viz-global.js"></script>
<script type="module">
import { renderToString } from '/node_modules/@plantuml/core/plantuml.js'
const source = ${JSON.stringify(unresolved)}
renderToString(
  source.split(/\\r?\\n/),
  (svg) => { window.renderResult = { ok: true, svg } },
  (err) => { window.renderResult = { ok: false, err } },
)
</script>
</body></html>`

const htmlPath = join(root, 'scripts', '_render-test.html')
writeFileSync(htmlPath, html)

const server = createServer((req, res) => {
  const url = req.url === '/' ? '/scripts/_render-test.html' : req.url
  const filePath = join(root, decodeURIComponent(url ?? ''))
  try {
    const data = readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': mime[extname(filePath)] ?? 'text/plain' })
    res.end(data)
  } catch {
    res.writeHead(404)
    res.end('not found')
  }
})

await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${port}/`)
await page.waitForFunction(() => window.renderResult !== undefined, null, { timeout: 120000 })
const result = await page.evaluate(() => window.renderResult)
if (result.ok) {
  const hasError = /error|syntax|cannot|PlantUML/i.test(result.svg)
  console.log('SVG length:', result.svg.length)
  console.log('Contains error markers:', hasError)
  const textMatch = result.svg.match(/<text[^>]*>([^<]{10,200})<\/text>/g)
  if (textMatch) console.log('Text nodes:', textMatch.slice(0, 5).join('\n'))
} else {
  console.log('Error callback:', result.err)
}
await browser.close()
server.close()
