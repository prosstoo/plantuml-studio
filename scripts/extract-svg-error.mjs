import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { chromium } from 'playwright'

const sample = readFileSync(
  'c:/Users/pross/OneDrive/Desktop/рабочие файлы/Сменные задания/РНК/Диаграммы/ФМ_Задания_и_Заказы_ЭСПЦ/03_Фаза_ССЗ.puml',
  'utf8',
)

const html = `<!doctype html><html><body>
<script src="/public/vendor/viz-global.js"></script>
<script type="module">
import { renderToString } from '/node_modules/@plantuml/core/plantuml.js'
renderToString(
  ${JSON.stringify(sample)}.split(/\\r?\\n/),
  (svg) => { window.r = svg },
  (e) => { window.r = 'ERR:' + e },
)
</script></body></html>`

writeFileSync('scripts/_t.html', html)

const server = createServer((req, res) => {
  const p = join('.', req.url === '/' ? '/scripts/_t.html' : (req.url ?? '').slice(1))
  try {
    res.end(readFileSync(p))
  } catch {
    res.statusCode = 404
    res.end()
  }
})

await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${port}`)
await page.waitForFunction(() => window.r !== undefined)
const svg = await page.evaluate(() => window.r)
const texts = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)]
  .map((m) => m[1].trim())
  .filter((t) => t.length > 2 && !t.includes('PlantUML version') && !t.includes('consider upgrading'))
console.log(texts.join('\n'))
await browser.close()
server.close()
