export interface ColorPreset {
  id: string
  name: string
  color: string
  description: string
}

export const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'external',
    name: 'Внешние системы',
    color: '#EEEEEE',
    description: 'ERP, интеграции',
  },
  {
    id: 'roles',
    name: 'Роли',
    color: '#E8F4E8',
    description: 'Actor-области',
  },
  {
    id: 'fm',
    name: 'ФМ модуль',
    color: '#E8EEF8',
    description: 'Бизнес-логика',
  },
  {
    id: 'adjacent',
    name: 'Смежные модули',
    color: '#FFF3E0',
    description: 'Соседние ФМ',
  },
]
