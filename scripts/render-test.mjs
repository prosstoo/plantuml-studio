import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mime = { '.js': 'text/javascript', '.html': 'text/html' }

const common = readFileSync(
  'c:/Users/pross/OneDrive/Desktop/рабочие файлы/Сменные задания/РНК/Диаграммы/ФМ_Задания_и_Заказы_ЭСПЦ/_common.puml',
  'utf8',
)
const sample = readFileSync(
  'c:/Users/pross/OneDrive/Desktop/рабочие файлы/Сменные задания/РНК/Диаграммы/ФМ_Задания_и_Заказы_ЭСПЦ/03_Фаза_ССЗ.puml',
  'utf8',
)

const resolved = sample.replace(/^!include _common\.puml$/m, common.trim())

const html = `<!doctype html>
<html><head><meta charset="utf-8"></head><body>
<script src="/public/vendor/viz-global.js"></script>
<script type="module">
import { renderToString } from '/node_modules/@plantuml/core/plantuml.js'
const source = ${JSON.stringify(resolved)}
renderToString(
  source.split(/\\r?\\n/),
  (svg) => { window.renderResult = { ok: true, len: svg.length } },
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
page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message))
await page.goto(`http://127.0.0.1:${port}/`)
await page.waitForFunction(() => window.renderResult !== undefined, null, { timeout: 120000 })
const result = await page.evaluate(() => window.renderResult)
console.log(JSON.stringify(result, null, 2))
await browser.close()
server.close()
