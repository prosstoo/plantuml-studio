import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkgPath = join(root, 'node_modules', '@plantuml', 'core', 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const version = pkg.version

copyFileSync(
  join(root, 'node_modules', '@plantuml', 'core', 'viz-global.js'),
  join(root, 'public', 'vendor', 'viz-global.js'),
)

const versionFile = join(root, 'public', 'vendor', 'plantuml-version.json')
writeFileSync(versionFile, JSON.stringify({ version, updatedAt: new Date().toISOString() }, null, 2))

console.log(`PlantUML engine synced: @plantuml/core@${version}`)
