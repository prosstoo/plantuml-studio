import { readFileSync } from 'node:fs'
import { parseParticipants, parseBoxes, isSequenceDiagram } from '../src/lib/pumlParser.ts'
import { updateBoxColor, insertMessage, formatMessage } from '../src/lib/sourceMutator.ts'
import { applyDiagramTheme, hasCustomSkinparams } from '../src/lib/diagramThemes.ts'
import { resolveIncludes, resolveIncludesWithLineMap } from '../src/lib/includeResolver.ts'
import { ensureBundledIncludes } from '../src/lib/ensureProjectIncludes.ts'
import { isPlantUmlErrorSvg } from '../src/lib/plantumlErrorSvg.ts'
import {
  mapErrorToEditorLines,
  parsePlantUmlError,
  findIncludeLine,
} from '../src/lib/parsePlantUmlError.ts'

const samplePath =
  'c:/Users/pross/OneDrive/Desktop/рабочие файлы/Сменные задания/РНК/Диаграммы/ФМ_Задания_и_Заказы_ЭСПЦ/03_Фаза_ССЗ.puml'

const commonPath =
  'c:/Users/pross/OneDrive/Desktop/рабочие файлы/Сменные задания/РНК/Диаграммы/ФМ_Задания_и_Заказы_ЭСПЦ/_common.puml'

let failed = 0

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg)
    failed++
  } else {
    console.log('OK:', msg)
  }
}

const sample = readFileSync(samplePath, 'utf8')
const common = readFileSync(commonPath, 'utf8')

assert(isSequenceDiagram(sample), 'detects sequence diagram')
const participants = parseParticipants(sample)
assert(participants.length >= 5, `participants parsed (${participants.length})`)
assert(participants.some((p) => p.alias === 'SSZ'), 'finds SSZ alias')

const boxes = parseBoxes(sample)
assert(boxes.length === 2, `boxes parsed (${boxes.length})`)
assert(boxes[0].color === '#E8F4E8', 'box color parsed')

const withColor = updateBoxColor(sample, 'Роли', '#FF0000')
assert(withColor.includes('box "Роли" #FF0000'), 'updates box color')

const withMsg = insertMessage(sample, formatMessage('SSZ', 'DB', 'test'))
assert(withMsg.includes('SSZ -> DB : test'), 'inserts message')

const files = new Map([
  ['_common.puml', common],
  ['main.puml', sample],
])
const resolved = resolveIncludes(`!include _common.puml\n${sample}`, files)
assert(hasCustomSkinparams(resolved), 'resolved include has skinparam')
const themed = applyDiagramTheme('@startuml\nAlice -> Bob\n@enduml', 'espц')
assert(themed.includes('skinparam roundcorner'), 'applies theme to plain diagram')
const notThemed = applyDiagramTheme(resolved, 'espц')
assert(notThemed === resolved, 'skips theme when skinparam exists')

const withBundled = ensureBundledIncludes([{ path: '03_Фаза_ССЗ.puml', content: sample }])
assert(withBundled.some((f) => f.path === '_common.puml'), 'auto-adds _common.puml')

const resolvedSingle = resolveIncludes(sample, new Map(withBundled.map((f) => [f.path, f.content])))
assert(!resolvedSingle.includes('!include'), 'resolves include for single-file project')

assert(isPlantUmlErrorSvg('<text>[From textarea (line 2) ]</text>'), 'detects error SVG')

const parsed = parsePlantUmlError('[From textarea (line 18) ]\nsyntax error')
assert(parsed.resolvedLines.includes(18), 'parses resolved line from error')

const { lineMap } = resolveIncludesWithLineMap(sample, files, '03_Фаза_ССЗ.puml')
const mapped = mapErrorToEditorLines(
  '[From textarea (line 20) ]',
  lineMap,
  '03_Фаза_ССЗ.puml',
  sample,
  ['03_Фаза_ССЗ.puml', '_common.puml'],
)
assert(mapped.length > 0 && mapped[0].line > 0, 'maps resolved line to source file')

assert(findIncludeLine(sample, '_common.puml') === 2, 'finds !include line')

console.log(failed === 0 ? '\nAll smoke tests passed' : `\n${failed} test(s) failed`)
process.exit(failed > 0 ? 1 : 0)
