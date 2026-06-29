export type SnippetCategory = 'sequence' | 'state' | 'class' | 'activity' | 'common'

export interface Snippet {
  id: string
  label: string
  category: SnippetCategory
  code: string
}

export const SNIPPET_CATEGORIES: { id: SnippetCategory; label: string }[] = [
  { id: 'sequence', label: 'Sequence' },
  { id: 'state', label: 'State' },
  { id: 'class', label: 'Class' },
  { id: 'activity', label: 'Activity' },
  { id: 'common', label: 'Общие' },
]

export const SNIPPETS: Snippet[] = [
  // Sequence
  {
    id: 'seq-common',
    label: '_common.puml',
    category: 'sequence',
    code: `' Общие настройки
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true
skinparam BoxPadding 10
skinparam ParticipantPadding 20
skinparam shadowing false`,
  },
  {
    id: 'seq-box-external',
    label: 'Box: Внешние системы',
    category: 'sequence',
    code: `box "Внешние системы" #EEEEEE
  participant "СУПР\\n(ERP)" as SUPR
  participant "ТЕХНСИ" as TEHNSI
end box`,
  },
  {
    id: 'seq-box-roles',
    label: 'Box: Роли',
    category: 'sequence',
    code: `box "Роли" #E8F4E8
  actor "ИТР цеха" as ITR
  actor "Администратор" as ADM
end box`,
  },
  {
    id: 'seq-box-fm',
    label: 'Box: ФМ модуль',
    category: 'sequence',
    code: `box "ФМ «Модуль»" #E8EEF8
  participant "Сервис" as SVC
  database "БД" as DB
end box`,
  },
  {
    id: 'seq-participant',
    label: 'Participant',
    category: 'sequence',
    code: 'participant "Название" as ALIAS',
  },
  {
    id: 'seq-actor',
    label: 'Actor',
    category: 'sequence',
    code: 'actor "Роль" as ROLE',
  },
  {
    id: 'seq-database',
    label: 'Database',
    category: 'sequence',
    code: 'database "БД" as DB',
  },
  {
    id: 'seq-autonumber',
    label: 'Autonumber',
    category: 'sequence',
    code: 'autonumber "<b>1."',
  },
  {
    id: 'seq-phase',
    label: 'Фаза (==)',
    category: 'sequence',
    code: '== Название фазы ==',
  },
  {
    id: 'seq-alt',
    label: 'Alt / Else',
    category: 'sequence',
    code: `alt Условие истинно
  A -> B : Действие
else Условие ложно
  A -> B : Альтернатива
end`,
  },
  {
    id: 'seq-par',
    label: 'Par / Else',
    category: 'sequence',
    code: `par Параллельный поток 1
  A -> B : Действие 1
else Параллельный поток 2
  A -> C : Действие 2
end`,
  },
  {
    id: 'seq-note',
    label: 'Note over',
    category: 'sequence',
    code: `note over PARTICIPANT
  Пояснение к диаграмме
end note`,
  },
  {
    id: 'seq-message',
    label: 'Сообщение',
    category: 'sequence',
    code: 'A -> B : Текст сообщения',
  },

  // State
  {
    id: 'state-basic',
    label: 'Состояние',
    category: 'state',
    code: 'state "Название" as StateName #lightblue',
  },
  {
    id: 'state-transition',
    label: 'Переход',
    category: 'state',
    code: 'State1 --> State2 : Событие / условие',
  },
  {
    id: 'state-start',
    label: 'Начало',
    category: 'state',
    code: '[*] --> StateName : Инициализация',
  },
  {
    id: 'state-end',
    label: 'Конец',
    category: 'state',
    code: 'StateName --> [*]',
  },
  {
    id: 'state-note',
    label: 'Note справа',
    category: 'state',
    code: `note right of StateName
  Описание состояния
end note`,
  },
  {
    id: 'state-composite',
    label: 'Вложенные состояния',
    category: 'state',
    code: `state Composite {
  state SubState1
  state SubState2
  SubState1 --> SubState2
}`,
  },

  // Class
  {
    id: 'class-basic',
    label: 'Класс',
    category: 'class',
    code: `class ClassName {
  +publicField: string
  -privateField: int
  +method(): void
}`,
  },
  {
    id: 'class-interface',
    label: 'Interface',
    category: 'class',
    code: `interface Service {
  +execute(): void
}`,
  },
  {
    id: 'class-relation',
    label: 'Связь классов',
    category: 'class',
    code: 'ClassA --> ClassB : uses',
  },
  {
    id: 'class-package',
    label: 'Package',
    category: 'class',
    code: `package "Модуль" #E8EEF8 {
  class ServiceA
  class ServiceB
}`,
  },
  {
    id: 'class-note',
    label: 'Note',
    category: 'class',
    code: `note right of ClassName
  Пояснение
end note`,
  },

  // Activity
  {
    id: 'activity-start',
    label: 'Начало / Конец',
    category: 'activity',
    code: `start
:Действие;
stop`,
  },
  {
    id: 'activity-if',
    label: 'Условие (if)',
    category: 'activity',
    code: `if (Условие?) then (да)
  :Действие 1;
else (нет)
  :Действие 2;
endif`,
  },
  {
    id: 'activity-fork',
    label: 'Параллель (fork)',
    category: 'activity',
    code: `fork
  :Поток A;
fork again
  :Поток B;
end fork`,
  },
  {
    id: 'activity-partition',
    label: 'Partition (swimlane)',
    category: 'activity',
    code: `|Роль A|
start
:Действие;
|Роль B|
:Следующее действие;
stop`,
  },

  // Common
  {
    id: 'common-wrapper',
    label: '@startuml / @enduml',
    category: 'common',
    code: `@startuml DiagramName
title Название диаграммы

' Ваш код здесь

@enduml`,
  },
  {
    id: 'common-title',
    label: 'Title',
    category: 'common',
    code: 'title Название диаграммы',
  },
  {
    id: 'common-include',
    label: '!include',
    category: 'common',
    code: '!include _common.puml',
  },
  {
    id: 'common-skinparam',
    label: 'skinparam',
    category: 'common',
    code: 'skinparam shadowing false',
  },
]

export function getSnippetsByCategory(category: SnippetCategory): Snippet[] {
  return SNIPPETS.filter((s) => s.category === category)
}
