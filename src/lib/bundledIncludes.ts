/** Встроенные файлы для !include, если не загружены в проект */
export const BUNDLED_INCLUDES: Record<string, string> = {
  '_common.puml': `' Общие настройки набора диаграмм ФМ «Задания и Заказы ЭСПЦ»
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true
skinparam BoxPadding 10
skinparam ParticipantPadding 20
skinparam shadowing false
`,
}

export function getBundledInclude(path: string): string | undefined {
  const basename = path.replace(/\\/g, '/').split('/').pop() ?? path
  return BUNDLED_INCLUDES[basename] ?? BUNDLED_INCLUDES[path]
}
