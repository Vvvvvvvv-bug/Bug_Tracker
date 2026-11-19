export const statuses = [
    'Open',
    'In Progress',
    'Fixed',
    'Verified',
    'Closed',
    'Reopened',
    'Rejected'
] as const;
export const priorities = ['Высокий', 'Средний', 'Низкий'] as const;
export type Status = typeof statuses[number];
export type Priority = typeof priorities[number];
export interface Bug {
    id: number;
    title: string;
    description: string;
    steps: string;
    expected: string;
    priority: Priority;
    status: Status;
    assignee: string;
    deadline: string;
}
export const storageKey = 'bug-tracker.basic-ts.v1';
export function examples(): Bug[] {
    return [
        {
            id: 14,
            title: 'Пропадает расписание после сохранения',
            description: 'После добавления пары запись исчезает из расписания.',
            steps: 'Открыть расписание\nДобавить пару и сохранить\nОбновить страницу',
            expected: 'Пара остаётся в расписании.',
            priority: 'Высокий',
            status: 'In Progress',
            assignee: 'Ильдар',
            deadline: '2026-11-23'
        },
        {
            id: 12,
            title: 'Долгий вход при повторном открытии',
            description: 'При повторном входе страница долго загружается.',
            steps: 'Открыть сайт\nВойти повторно',
            expected: 'Список проектов открывается без задержки.',
            priority: 'Средний',
            status: 'Reopened',
            assignee: 'Ильдар',
            deadline: '2026-11-23'
        },
        {
            id: 15,
            title: 'Опечатка в названии раздела',
            description: 'В названии раздела пропущена буква.',
            steps: 'Открыть главное меню',
            expected: 'Название написано без ошибок.',
            priority: 'Низкий',
            status: 'Open',
            assignee: '',
            deadline: ''
        },
    ];
}
export function isBug(value: unknown): value is Bug {
    if (!value || typeof value !== 'object')
        return false;
    const b = value as Record<string, unknown>;
    return typeof b.id === 'number' && Number.isSafeInteger(b.id) && b.id > 0
        && [
            'title',
            'description',
            'steps',
            'expected',
            'assignee',
            'deadline'
        ].every(key => typeof b[key] === 'string')
        && statuses.some(status => status === b.status) && priorities.some(priority => priority === b.priority);
}
export function loadBugs(storage: Pick<Storage, 'getItem'> | null): Bug[] {
    try {
        const value: unknown = JSON.parse(storage?.getItem(storageKey) || 'null');
        return Array.isArray(value) && value.every(isBug) ? value : examples();
    }
    catch {
        return examples();
    }
}
export function saveBugs(storage: Pick<Storage, 'setItem'> | null, bugs: Bug[]): boolean {
    if (!storage)
        return false;
    try {
        storage.setItem(storageKey, JSON.stringify(bugs));
        return true;
    }
    catch {
        return false;
    }
}
export function searchBugs(bugs: Bug[], query: string, status: string): Bug[] {
    const search = query.trim().toLocaleLowerCase('ru');
    return bugs.filter(b => (!search || `#${b.id} ${b.title}`.toLocaleLowerCase('ru').includes(search))
        && (!status || b.status === status));
}
export function escapeHtml(value: string): string {
    const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return value.replace(/[&<>"']/g, char => entities[char]);
}
export interface ExtendedBug extends Bug {
    release?: string;
    reason?: string;
    environment?: string;
    attachments?: string[];
    history?: string[];
    links?: string[];
    author?: string;
    created?: string;
    project?: string;
}
