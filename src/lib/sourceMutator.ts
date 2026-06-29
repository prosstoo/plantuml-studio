export type InsertPosition = 'end' | 'afterParticipants'

function normalizeHexColor(color: string): string {
  const raw = color.trim().startsWith('#') ? color.trim() : `#${color.trim()}`
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toUpperCase()
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const r = raw[1]
    const g = raw[2]
    const b = raw[3]
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return raw.toUpperCase()
}

export function toColorInputValue(color: string): string {
  const normalized = normalizeHexColor(color || '#E8EEF8')
  return normalized.toLowerCase()
}

export function updateBoxColor(
  source: string,
  boxName: string,
  newColor: string,
): string {
  const color = normalizeHexColor(newColor)
  const hadCrLf = source.includes('\r\n')
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  let changed = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '')
    const match = line.match(/^(\s*box\s+"([^"]+)")(?:\s+(#[0-9a-fA-F]{3,8}))?\s*$/)
    if (!match || match[2] !== boxName) continue

    lines[i] = `${match[1]} ${color}`
    changed = true
    break
  }

  if (!changed) return source

  const result = lines.join('\n')
  return hadCrLf ? result.replace(/\n/g, '\r\n') : result
}

export function insertBox(
  source: string,
  name: string,
  color: string,
  participants = '  participant "Сервис" as SVC',
): string {
  const block = `box "${name}" ${normalizeHexColor(color)}\n${participants}\nend box\n`
  return insertAtPosition(source, block, 'afterParticipants')
}

export function insertMessage(
  source: string,
  line: string,
  position: InsertPosition = 'afterParticipants',
): string {
  return insertAtPosition(source, `${line}\n`, position)
}

export function insertMessages(
  source: string,
  lines: string[],
  position: InsertPosition = 'afterParticipants',
): string {
  return insertAtPosition(source, lines.map((l) => `${l}\n`).join(''), position)
}

function insertAtPosition(
  source: string,
  text: string,
  position: InsertPosition,
): string {
  if (position === 'end') {
    const endIdx = source.lastIndexOf('@enduml')
    if (endIdx === -1) return source + '\n' + text
    const before = source.slice(0, endIdx).trimEnd()
    return before + '\n\n' + text + '\n' + source.slice(endIdx)
  }

  const insertIdx = findAfterParticipantsIndex(source)
  return source.slice(0, insertIdx) + '\n' + text + source.slice(insertIdx)
}

function findAfterParticipantsIndex(source: string): number {
  const lines = source.split('\n')
  let lastParticipantLine = -1
  let inBoxDepth = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*box\s+"/i.test(line)) inBoxDepth++
    if (/^\s*end\s+box\s*$/i.test(line)) inBoxDepth = Math.max(0, inBoxDepth - 1)

    if (
      /^\s*(participant|actor|database)\s+/i.test(line) ||
      (/^\s*end\s+box\s*$/i.test(line) && inBoxDepth === 0)
    ) {
      lastParticipantLine = i
    }

    if (/^\s*==\s*.+\s*==\s*$/.test(line) && lastParticipantLine >= 0) {
      return lineIndexToOffset(source, i)
    }

    if (/^\s*autonumber\b/i.test(line) && lastParticipantLine >= 0) {
      return lineIndexToOffset(source, i + 1)
    }
  }

  if (lastParticipantLine >= 0) {
    return lineIndexToOffset(source, lastParticipantLine + 1)
  }

  const startuml = source.match(/^@startuml[^\n]*\n/m)
  if (startuml && startuml.index !== undefined) {
    return startuml.index + startuml[0].length
  }

  return source.length
}

function lineIndexToOffset(source: string, lineIndex: number): number {
  const lines = source.split('\n')
  let offset = 0
  for (let i = 0; i < lineIndex && i < lines.length; i++) {
    offset += lines[i].length + 1
  }
  return offset
}

export type ArrowType = '->' | '-->' | '<--' | '<->'

export function formatMessage(
  from: string,
  to: string,
  text: string,
  arrow: ArrowType = '->',
): string {
  const trimmed = text.trim()
  return trimmed ? `${from} ${arrow} ${to} : ${trimmed}` : `${from} ${arrow} ${to}`
}

export function formatRequestResponse(
  from: string,
  to: string,
  requestText: string,
  responseText: string,
): string[] {
  return [
    formatMessage(from, to, requestText, '->'),
    formatMessage(to, from, responseText, '-->'),
  ]
}
