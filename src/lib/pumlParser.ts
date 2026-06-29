export type ParticipantKind = 'actor' | 'participant' | 'database'

export interface PumlParticipant {
  alias: string
  label: string
  kind: ParticipantKind
  boxName?: string
  line: number
}

export interface PumlBox {
  name: string
  color: string
  line: number
  lineEnd?: number
}

const PARTICIPANT_RE =
  /^\s*(participant|actor|database)\s+(?:"([^"]*(?:\\.[^"]*)*)"|'([^']*)'|(\S+))(?:\s+as\s+(\w+))?/i

const BOX_RE = /^\s*box\s+"([^"]+)"(?:\s+(#[\w]+))?/i
const BOX_END_RE = /^\s*end\s+box\s*$/i

function unescapeLabel(raw: string): string {
  return raw.replace(/\\n/g, '\n').replace(/\\"/g, '"')
}

export function parseBoxes(source: string): PumlBox[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const boxes: PumlBox[] = []
  let current: PumlBox | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const boxMatch = line.match(BOX_RE)
    if (boxMatch) {
      if (current) {
        current.lineEnd = i - 1
        boxes.push(current)
      }
      current = {
        name: boxMatch[1],
        color: boxMatch[2] ?? '',
        line: i,
      }
      continue
    }
    if (BOX_END_RE.test(line) && current) {
      current.lineEnd = i
      boxes.push(current)
      current = null
    }
  }

  if (current) {
    current.lineEnd = lines.length - 1
    boxes.push(current)
  }

  return boxes
}

export function parseParticipants(source: string): PumlParticipant[] {
  const lines = source.split('\n')
  const boxes = parseBoxes(source)
  const participants: PumlParticipant[] = []
  const seen = new Set<string>()

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(PARTICIPANT_RE)
    if (!match) continue

    const kind = match[1].toLowerCase() as ParticipantKind
    const label = unescapeLabel(match[2] ?? match[3] ?? match[4] ?? '')
    const alias = match[5] ?? match[4] ?? label

    if (seen.has(alias)) continue
    seen.add(alias)

    const box = boxes.find(
      (b) => b.lineEnd !== undefined && i > b.line && i < b.lineEnd,
    )

    participants.push({
      alias,
      label,
      kind,
      boxName: box?.name,
      line: i,
    })
  }

  return participants
}

export function isSequenceDiagram(source: string): boolean {
  return /^\s*(participant|actor|database)\s+/m.test(source)
}
