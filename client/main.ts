import { loadBugs, saveBugs, escapeHtml as e, statuses, priorities } from './data.ts';
import type { ExtendedBug as Bug, Status, Priority } from './data.ts';
const root = document.querySelector<HTMLDivElement>('#app')!;
const get = <T>(k: string, d: T): T => {
    try {
        return JSON.parse(localStorage.getItem(k) || 'null') ?? d;
    }
    catch {
        return d;
    }
};
const put = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));
const seed: Bug[] = [
    [
        14,
        'Пропадает расписание',
        'Высокий',
        'In Progress',
        'Ильдар',
        '2026-11-20'
    ],
    [
        12,
        'Долгий вход',
        'Средний',
        'Reopened',
        'Ильдар',
        '2026-11-12'
    ],
    [
        11,
        'Не сохраняется тема оформления',
        'Средний',
        'Verified',
        'Ильдар',
        '2026-11-15'
    ],
    [
        17,
        'Падает экспорт в PDF',
        'Средний',
        'In Progress',
        'Ильдар',
        '2026-11-22'
    ],
    [
        18,
        'Долго грузится вход',
        'Средний',
        'Rejected',
        '',
        ''
    ],
    [
        13,
        'Съезжает таблица в Safari',
        'Низкий',
        'Verified',
        'Ильдар',
        '2026-11-19'
    ],
    [
        15,
        'Опечатка в меню',
        'Низкий',
        'Open',
        '',
        ''
    ]
].map(([id, title, priority, status, assignee, deadline]) => ({
    id: Number(id),
    title: String(title),
    priority: priority as Priority,
    status: status as Status,
    assignee: String(assignee),
    deadline: String(deadline),
    description: Number(id) === 14 ? 'После нажатия «Сохранить» добавленная пара исчезает из расписания.' : '',
    steps: Number(id) === 14 ? '1. Открыть «Расписание».  2. Добавить пару, нажать «Сохранить».  3. Обновить страницу.' : '',
    expected: Number(id) === 14 ? 'Пара видна после перезагрузки страницы.' : '',
    release: Number(id) === 17 ? 'v1.2' : Number(id) === 15 ? '' : 'v1.1',
    reason: Number(id) === 14 ? 'Ломает демо на защите 18.11' : '',
    environment: Number(id) === 14 ? 'Chrome 130, сборка 1.0.3' : '',
    attachments: Number(id) === 14 ? ['console.log', 'screen.png'] : [],
    author: 'Олег (QA)',
    created: '2026-11-15',
    history: Number(id) === 14 ? ['18.11 10:02  Ильдар: Open → In Progress', '16.11 14:30  Анна: план задан', '15.11 09:12  Олег: баг зарегистрирован'] : [],
    project: 'StudyPlanner'
}));
let bugs = get<Bug[]>('tracker.bugs.v2', localStorage.getItem('bug-tracker.basic-ts.v1') ? loadBugs(localStorage) : seed);
let projects = get('tracker.projects', [{
        name: 'StudyPlanner',
        description: 'Приложение для расписания пар',
        repo: 'https://git.example/team/studyplanner',
        role: 'Lead'
    }, {
        name: 'Bookshelf',
        description: 'Учёт книг в общежитии',
        repo: '',
        role: 'Dev'
    }]);
let project = get('tracker.project', 'StudyPlanner');
let user = get('tracker.user', {
    name: 'Олег',
    role: 'QA',
    email: 'oleg@student.example'
});
let members = get('tracker.members', [
    {
        name: 'Анна',
        email: 'anna@student.example',
        roles: ['Lead']
    },
    {
        name: 'Олег',
        email: 'oleg@student.example',
        roles: ['QA']
    },
    {
        name: 'Ильдар',
        email: 'ildar@student.example',
        roles: ['Dev']
    },
    {
        name: 'Мария',
        email: 'maria@student.example',
        roles: ['QA', 'Dev']
    }
]);
let releases = get('tracker.releases', [{
        version: 'v1.2',
        date: '2026-12-10',
        published: ''
    }, {
        version: 'v1.1',
        date: '2026-11-18',
        published: ''
    }, {
        version: 'v1.0',
        date: '2026-10-01',
        published: '2026-10-01'
    }]);
let filters = {
    q: '',
    status: '',
    priority: '',
    assignee: '',
    release: '',
    mine: false,
    late: false
};
let modal = '';
let active = 0;
let files: File[] = [];
let linkCount = 1;
const today = () => new Date().toLocaleDateString('en-CA');
const fmt = (s?: string) => s ? s.split('-').reverse().join('.') : '—';
const save = () => {
    put('tracker.bugs.v2', bugs);
    saveBugs(localStorage, bugs);
    put('tracker.projects', projects);
    put('tracker.project', project);
    put('tracker.user', user);
    put('tracker.members', members);
    put('tracker.releases', releases);
};
const opt = (arr: readonly string[], sel = '', all?: string) => (all !== undefined ? `<option value="">${all}</option>` : '') + arr.map(v => `<option ${v === sel ? 'selected' : ''} value="${e(v)}">${e(v)}</option>`).join('');
const field = (label: string, html: string) => `<label class="field"><span>${label}</span>${html}</label>`;
const input = (name: string, value = '', type = 'text', extra = '') => `<input name="${name}" type="${type}" value="${e(value)}" ${extra}>`;
const select = (name: string, arr: readonly string[], sel = '', all?: string) => `<select name="${name}">${opt(arr, sel, all)}</select>`;
const btn = (label: string, action: string, cls = '') => `<button type="button" class="button ${cls}" data-action="${action}">${label}</button>`;
const go = (p: string) => {
    modal = '';
    location.hash = '/' + p;
    render();
};
const badge = (s: string) => `<span class="badge ${s.toLowerCase().replace(' ', '-')}">${e(s)}</span>`;
const current = () => bugs.filter(b => (b.project || 'StudyPlanner') === project);
const heading = (title: string, action = '', sub = '') => `<div class="heading"><div><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div>${action}</div>`;
const table = (heads: string[], rows: string[][]) => `<div class="table-wrap"><table><thead><tr>${heads.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function listRows() {
    const all = current();
    const f = filters;
    const found = all.filter(b => (!f.q || `#${b.id} ${b.title} ${b.description}`.toLowerCase().includes(f.q.toLowerCase())) && (!f.status || b.status === f.status) && (!f.priority || b.priority === f.priority) && (!f.assignee || b.assignee === f.assignee) && (!f.release || b.release === f.release) && (!f.mine || b.assignee === user.name) && (!f.late || !!b.deadline && b.deadline < today() && !['Verified', 'Closed', 'Rejected'].includes(b.status))).sort((a, b) => priorities.indexOf(a.priority) - priorities.indexOf(b.priority) || (a.deadline || '9999').localeCompare(b.deadline || '9999') || (a.created || '').localeCompare(b.created || ''));
    return table([
        '№',
        'Название',
        'Статус',
        'Приоритет',
        'Исполнитель',
        'Дедлайн'
    ], found.map(b => [
        `#${b.id}`,
        `<a class="title-link" href="#/bug/${b.id}">${e(b.title)}</a>`,
        badge(b.status),
        e(b.priority),
        e(b.assignee || '—'),
        `<span class="${b.deadline && b.deadline < today() && !['Verified', 'Closed', 'Rejected'].includes(b.status) ? 'red' : ''}">${fmt(b.deadline)}${b.deadline && b.deadline < today() && !['Verified', 'Closed', 'Rejected'].includes(b.status) ? ' (!)' : ''}</span>`
    ])) + `<p class="note">Показано ${found.length} из ${all.length} · сортировка: приоритет → дедлайн → дата регистрации</p>`;
}
function list() {
    return heading('Баги проекта', `<a class="button primary" href="#/new">+ Зарегистрировать баг</a>`) + `<div class="panel filters"><div class="filter-grid">${field('Поиск', input('q', filters.q, 'search', 'placeholder="Номер или текст"'))}${field('Статус', select('status', statuses, filters.status, 'Все'))}${field('Приоритет', select('priority', priorities, filters.priority, 'Все'))}${field('Исполнитель', select('assignee', members.map(m => m.name), filters.assignee, 'Все'))}${field('Релиз', select('release', releases.map(r => r.version), filters.release, 'Все'))}</div><div class="filter-links"><label><input type="checkbox" name="mine" ${filters.mine ? 'checked' : ''}> Мои задачи</label><label><input type="checkbox" name="late" ${filters.late ? 'checked' : ''}> Просроченные</label>${btn('Сбросить фильтры', 'reset', 'link')}</div></div><div id="rows">${listRows()}</div>`;
}
const section = (title: string, value: string) => `<section><h3>${title}</h3><p>${e(value || '—')}</p></section>`;
function detail(b: Bug) {
    const rel = releases.find(r => r.version === b.release);
    return `<a class="back" href="#/bugs">‹ К списку</a><div class="detail-title"><h1>#${b.id} ${e(b.title)}</h1>${badge(b.status)}<strong class="${b.priority === 'Высокий' ? 'red' : ''}">${e(b.priority)}</strong></div><div class="detail-grid"><article class="panel">${section('Что происходит', b.description)}${section('Шаги воспроизведения', b.steps)}${section('Ожидаемый результат', b.expected)}${section('Окружение и вложения', [b.environment, ...(b.attachments || [])].filter(Boolean).join(' · '))}<section><h3>Ссылки на изменения</h3><p class="blue">${(b.links || []).map(e).join('<br>') || '—'}</p></section><section><h3>История</h3><p class="muted">${(b.history || []).map(e).join('<br>') || '—'}</p></section></article><aside class="panel"><h2>План</h2>${[
        ['Релиз', b.release ? b.release + ' · ' + fmt(rel?.date) : '—'],
        ['Дедлайн', fmt(b.deadline)],
        ['Основание', b.reason],
        ['Исполнитель', b.assignee],
        ['Автор', b.author],
        ['Создан', fmt(b.created)]
    ].map(([k, v]) => `<div class="meta"><span>${k}</span><strong>${e(v || '—')}</strong></div>`).join('')}</aside>\
</div>\
<div class="panel actions">\
<span class="muted">Действия (видны только доступные роли и статусу)</span>\
<div>${user.role === 'Lead' ? btn('Изменить план', 'plan', 'primary') : ''}${user.role === 'Dev' && ['Open', 'Reopened'].includes(b.status) ? btn('Взять в работу', 'start-work', 'primary') : ''}${user.role === 'Dev' && b.status === 'In Progress' ? btn('Передать на проверку', 'review', 'primary') : ''}${user.role === 'QA' && b.status === 'Fixed' ? btn('Подтвердить', 'verify', 'green') + btn('Вернуть', 'return', 'danger') : ''}${user.role === 'Lead' && !['Verified', 'Rejected'].includes(b.status) ? btn('Отклонить', 'reject', 'danger') : ''}</div></div>`;
}
function newBug() {
    return heading('Новый баг · ' + e(project)) + `<form id="new" class="panel bug-form">${field('Название *', input('title', '', 'text', 'required minlength="5" maxlength="150"'))}${field('Что происходит *', '<textarea name="description" required rows="1"></textarea>')}${field('Шаги воспроизведения *', '<textarea name="steps" required rows="1"></textarea>')}<div class="two">${field('Ожидаемый результат *', input('expected', '', 'text', 'required'))}${field('Окружение', input('environment'))}</div><div class="attachment-row">${field('Приоритет *', select('priority', priorities))}<label class="button upload">Прикрепить файлы<input id="attachments" type="file" multiple accept=".png,.jpg,.jpeg,.gif,.txt,.log,.json,.pdf">\
</label>\
<span id="file-names" class="blue">\
</span>\
</div>\
<p class="muted small">До 10 файлов по 10 МБ: png, jpg, gif, txt, log, json, pdf</p>\
<div class="form-actions">\
<a class="button" href="#/bugs">Отмена</a>\
<button class="button primary">Сохранить</button>\
</div>\
</form>`;
}
function releasePage() {
    return heading('Релизы', btn('+ Новый релиз', 'new-release', 'primary'), 'Готово — баги релиза в Verified или Rejected') + table([
        'Версия',
        'Плановая дата',
        'Статус',
        'Готово / всего',
        ''
    ], releases.map(r => {
        const a = current().filter(b => b.release === r.version);
        return [
            e(r.version),
            fmt(r.date),
            r.published ? 'Published' : 'Planned',
            `${a.filter(b => ['Verified', 'Rejected'].includes(b.status)).length} / ${a.length}${r.published ? ' · выпущен ' + fmt(r.published) : ''}`,
            r.published ? '' : btn('Выпустить', 'publish:' + r.version)
        ];
    })) + `<p class="note">«Выпустить» открывает окно со списком неготовых багов или полем фактической даты выпуска.</p>`;
}
function memberPage() {
    const p = projects.find(p => p.name === project)!;
    return heading('Участники · ' + e(project), btn('+ Добавить по email', 'member', 'primary'), 'Роли задаются в каждом ПО, их можно совмещать') + `<form id="project-info" class="panel"><h3>Сведения ПО</h3><div class="info-grid">${field('Название *', input('name', p.name, 'text', 'required'))}${field('Ссылка на репозиторий', input('repo', p.repo, 'url'))}<button class="button">Сохранить</button></div></form>` + table([
        'Имя',
        'Email',
        'Lead',
        'QA',
        'Dev',
        'Действия'
    ], members.map((m, i) => [
        e(m.name),
        e(m.email),
        ...['Lead', 'QA', 'Dev'].map(r => `<input type="checkbox" data-member="${i}" data-role="${r}" ${m.roles.includes(r) ? 'checked' : ''}>`),
        m.roles.includes('Lead') ? '' : btn('Удалить', 'remove:' + i, 'link red')
    ]));
}
function projectPage() {
    return heading('Мои ПО', btn('+ Создать ПО', 'project', 'primary'), 'ПО, в которых вы участник') + `<div class="projects">${projects.map(p => `<article class="panel"><h2>${e(p.name)}</h2><p class="muted">${e(p.description)}</p><p class="blue">Ваша роль: ${e(p.role)}</p>${btn('Открыть', 'open:' + e(p.name))}</article>`).join('')}</div>\
<p class="note">«Создать ПО» открывает окно: название *, описание, ссылка на репозиторий; создатель становится Lead.</p>`;
}
function auth(register: boolean) {
    return `<div class="auth"><form id="auth" class="panel"><h1>Трекер багов</h1><p class="muted">${register ? 'Регистрация' : 'Вход в систему'}</p><nav class="tabs"><a class="${!register ? 'selected' : ''}" href="#/login">Вход</a><a class="${register ? 'selected' : ''}" href="#/register">Регистрация</a></nav>${register ? field('Имя *', input('name', '', 'text', 'required')) : ''}${field('Email *', input('email', '', 'email', 'required'))}${field('Пароль *', input('password', '', 'password', 'required minlength="5"'))}<button class="button primary">${register ? 'Зарегистрироваться' : 'Войти'}</button>\
<p class="muted small">Демонстрационный локальный вход, без серверной авторизации.</p>\
</form>\
</div>`;
}
let publishVersion = '';
function dialog() {
    const b = bugs.find(x => x.id === active);
    let title = '', body = '', submit = 'Сохранить', cls = 'primary';
    if (modal === 'plan' && b) {
        title = 'План бага #' + b.id;
        body = field('Приоритет *', select('priority', priorities, b.priority)) + field('Плановый релиз *', select('release', releases.filter(r => !r.published).map(r => r.version), b.release)) + field('Дедлайн *', input('deadline', b.deadline, 'date', 'required')) + field('Основание *', input('reason', b.reason, 'text', 'required')) + field('Исполнитель', select('assignee', members.filter(m => m.roles.includes('Dev')).map(m => m.name), b.assignee, 'Не назначен')) + '<p class="muted small">Дедлайн — не раньше сегодняшнего дня и не позже плановой даты релиза.</p>';
    }
    else if (modal === 'review' && b) {
        title = 'Передать на проверку · #' + b.id;
        submit = 'Передать';
        body = '<p>Ссылки на commit / MR *</p>' + Array.from({
            length: linkCount
        }, (_, i) => `<div class="link-grid">${field('Тип', select('type' + i, ['MR/PR', 'Commit']))}${field('URL', input('url' + i, '', 'url', 'required placeholder="https://"'))}</div>`).join('') + btn('+ ссылка', 'add-link') + field('Комментарий для QA', input('comment')) + `<p class="muted small">Релиз из плана: ${e(b.release || '—')} (только чтение) · ссылок от 1 до 10, только https</p>`;
    }
    else if (['return', 'reject'].includes(modal) && b) {
        title = (modal === 'return' ? 'Вернуть на доработку' : 'Отклонить баг') + ' · #' + b.id;
        submit = modal === 'return' ? 'Вернуть' : 'Отклонить';
        cls = 'danger';
        body = field(modal === 'return' ? 'Комментарий *' : 'Причина *', input('comment', '', 'text', 'required minlength="5" maxlength="1000"')) + '<p class="muted small">От 5 до 1000 символов.</p>';
    }
    else if (modal === 'project') {
        title = 'Создать ПО';
        body = field('Название *', input('name', '', 'text', 'required')) + field('Описание', input('description')) + field('Ссылка на репозиторий', input('repo', '', 'url'));
    }
    else if (modal === 'member') {
        title = 'Добавить по email';
        body = field('Email *', input('email', '', 'email', 'required')) + field('Роль', select('role', ['QA', 'Dev', 'Lead']));
    }
    else if (modal === 'new-release') {
        title = 'Новый релиз';
        body = field('Версия *', input('version', '', 'text', 'required')) + field('Плановая дата *', input('date', '', 'date', 'required'));
    }
    else if (modal === 'publish') {
        title = 'Выпустить ' + e(publishVersion);
        const pending = current().filter(b => b.release === publishVersion && !['Verified', 'Rejected'].includes(b.status));
        body = pending.length ? '<p>Неготовые баги:</p>' + pending.map(b => `<p>#${b.id} ${e(b.title)}</p>`).join('') : field('Фактическая дата выпуска *', input('date', today(), 'date', 'required'));
        submit = pending.length ? '' : 'Выпустить';
    }
    else
        return '';
    return `<div class="overlay"><form id="dialog" role="dialog" aria-modal="true" class="panel modal"><h2>${title}</h2>${body}<p id="error" class="red"></p><div class="form-actions">${btn('Отмена', 'cancel')}${submit ? `<button class="button ${cls}">${submit}</button>` : ''}</div></form></div>`;
}
function render() {
    const [page, id] = location.hash.slice(2).split('/');
    if (['login', 'register'].includes(page)) {
        root.innerHTML = auth(page === 'register');
        return;
    }
    const p = page || 'bugs';
    active = Number(id) || active;
    const b = bugs.find(x => x.id === active);
    const content = p === 'projects' ? projectPage() : p === 'new' ? newBug() : p === 'bug' ? (b ? detail(b) : heading('Баг не найден')) : p === 'releases' ? releasePage() : p === 'members' ? memberPage() : list();
    root.innerHTML = `<header><a class="brand" href="#/projects">Трекер багов</a>${p === 'projects' ? '' : `<select id="project-picker" class="project-picker">${projects.map(x => `<option value="${e(x.name)}" ${x.name === project ? 'selected' : ''}>ПО: ${e(x.name)}</option>`).join('')}<option value="@">Мои ПО</option></select>`}<div class="user"><select id="role-picker" title="Демо: смена роли">${['QA', 'Lead', 'Dev'].map(r => `<option value="${r}" ${r === user.role ? 'selected' : ''}>${e(r === user.role ? user.name : r === 'Lead' ? 'Анна' : r === 'Dev' ? 'Ильдар' : 'Олег')} · ${r}</option>`).join('')}</select><a href="#/login">Выйти</a></div></header><main>${p === 'projects' ? '' : `<nav class="tabs">${[['bugs', 'Баги'], ['releases', 'Релизы'], ['members', 'Участники']].map(([k, v]) => `<a class="${k === (['bug', 'new'].includes(p) ? 'bugs' : p) ? 'selected' : ''}" href="#/${k}">${v}</a>`).join('')}</nav>`}${modal && b && [
        'plan',
        'review',
        'return',
        'reject'
    ].includes(modal) ? heading('#' + b.id + ' ' + e(b.title)) : content}</main>${dialog()}`;
}
function history(b: Bug, msg: string) {
    (b.history ??= []).unshift(new Date().toLocaleString('ru-RU') + '  ' + user.name + ': ' + msg);
}
root.addEventListener('click', ev => {
    const a = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
    if (!a)
        return;
    const b = bugs.find(x => x.id === active);
    if (a === 'reset') {
        filters = {
            q: '',
            status: '',
            priority: '',
            assignee: '',
            release: '',
            mine: false,
            late: false
        };
    }
    else if (a === 'cancel') {
        modal = '';
    }
    else if (a === 'start-work' && b) {
        if (user.role !== 'Dev' || !['Open', 'Reopened'].includes(b.status))
            return;
        history(b, b.status + ' → In Progress');
        b.status = 'In Progress';
        save();
    }
    else if (a === 'verify' && b) {
        if (user.role !== 'QA' || b.status !== 'Fixed')
            return;
        history(b, b.status + ' → Verified');
        b.status = 'Verified';
        save();
    }
    else if (a.startsWith('open:')) {
        project = a.slice(5);
        save();
        go('bugs');
        return;
    }
    else if (a.startsWith('remove:')) {
        members.splice(Number(a.slice(7)), 1);
        save();
    }
    else if (a.startsWith('publish:')) {
        publishVersion = a.slice(8);
        modal = 'publish';
    }
    else if (a === 'add-link') {
        if (linkCount >= 10)
            return;
        const form = document.querySelector('#dialog')!;
        const html = document.createElement('div');
        html.className = 'link-grid';
        html.innerHTML = field('Тип', select('type' + linkCount, ['MR/PR', 'Commit'])) + field('URL', input('url' + linkCount, '', 'url', 'required'));
        form.insertBefore(html, (ev.target as HTMLElement).closest('button'));
        linkCount++;
        return;
    }
    else {
        modal = a;
        linkCount = 1;
    }
    render();
});
function filterChange(t: HTMLInputElement | HTMLSelectElement) {
    if (t.closest('.filters') && t.name in filters) {
        const f = filters as Record<string, string | boolean>;
        f[t.name] = t instanceof HTMLInputElement && t.type === 'checkbox' ? t.checked : t.value;
        document.querySelector('#rows')!.innerHTML = listRows();
    }
}
root.addEventListener('input', ev => {
    const t = ev.target;
    if (t instanceof HTMLInputElement && t.name === 'q')
        filterChange(t);
});
root.addEventListener('change', ev => {
    const t = ev.target;
    if (!(t instanceof HTMLInputElement || t instanceof HTMLSelectElement))
        return;
    filterChange(t);
    if (t.id === 'project-picker') {
        if (t.value === '@') {
            go('projects');
            return;
        }
        project = t.value;
        save();
        go('bugs');
    }
    else if (t.id === 'role-picker') {
        user.role = t.value;
        user.name = t.value === 'Lead' ? 'Анна' : t.value === 'Dev' ? 'Ильдар' : 'Олег';
        save();
        render();
    }
    else if (t.dataset.member && t instanceof HTMLInputElement) {
        const m = members[Number(t.dataset.member)], r = t.dataset.role!;
        m.roles = t.checked ? [...new Set([...m.roles, r])] : m.roles.filter(x => x !== r);
        save();
    }
    else if (t.id === 'attachments' && t instanceof HTMLInputElement) {
        files = Array.from(t.files || []).filter(f => f.size <= 10 * 1024 * 1024).slice(0, 10);
        document.querySelector('#file-names')!.textContent = files.map(f => f.name).join(' · ');
    }
});
root.addEventListener('submit', ev => {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const d = new FormData(form);
    const v = (k: string) => String(d.get(k) || '').trim();
    const b = bugs.find(x => x.id === active);
    const fail = (s: string) => {
        const el = document.querySelector('#error');
        if (el)
            el.textContent = s;
        else
            alert(s);
    };
    if (form.id === 'new') {
        const added: Bug = {
            id: Math.max(0, ...bugs.map(b => b.id)) + 1,
            title: v('title'),
            description: v('description'),
            steps: v('steps'),
            expected: v('expected'),
            priority: v('priority') as Priority,
            status: 'Open',
            assignee: '',
            deadline: '',
            environment: v('environment'),
            attachments: files.map(f => f.name),
            author: user.name + ' (' + user.role + ')',
            created: today(),
            project,
            history: []
        };
        history(added, 'баг зарегистрирован');
        bugs.push(added);
        files = [];
        save();
        go('bug/' + added.id);
        return;
    }
    if (form.id === 'auth') {
        const m = members.find(m => m.email === v('email'));
        user = {
            name: v('name') || m?.name || v('email').split('@')[0],
            role: m?.roles[0] || 'QA',
            email: v('email')
        };
        save();
        go('projects');
        return;
    }
    if (form.id === 'project-info') {
        const p = projects.find(p => p.name === project)!;
        if (projects.some(x => x !== p && x.name === v('name')))
            return fail('Название уже существует');
        bugs.forEach(b => {
            if ((b.project || 'StudyPlanner') === project)
                b.project = v('name');
        });
        p.name = v('name');
        p.repo = v('repo');
        project = p.name;
    }
    else if (modal === 'plan' && b) {
        const r = releases.find(r => r.version === v('release'));
        if (!r || v('deadline') < today() || v('deadline') > r.date)
            return fail('Проверьте дедлайн и плановую дату релиза.');
        Object.assign(b, {
            priority: v('priority'),
            release: v('release'),
            deadline: v('deadline'),
            reason: v('reason'),
            assignee: v('assignee')
        });
        history(b, 'план задан');
    }
    else if (modal === 'review' && b) {
        if (user.role !== 'Dev' || b.status !== 'In Progress')
            return fail('Передать на проверку можно только баг в работе.');
        const links = Array.from({
            length: linkCount
        }, (_, i) => v('url' + i));
        if (links.some(x => !x.startsWith('https://')))
            return fail('Допустимы только https-ссылки');
        b.links = links.map((x, i) => v('type' + i) + ' ' + x + ' · ' + user.name + ' · ' + v('comment'));
        history(b, b.status + ' → Fixed');
        b.status = 'Fixed';
    }
    else if (b && ['return', 'reject'].includes(modal)) {
        const next = modal === 'return' ? 'Reopened' : 'Rejected';
        history(b, b.status + ' → ' + next + ' · ' + v('comment'));
        b.status = next;
    }
    else if (modal === 'project') {
        if (projects.some(p => p.name === v('name')))
            return fail('ПО уже существует');
        projects.push({
            name: v('name'),
            description: v('description'),
            repo: v('repo'),
            role: 'Lead'
        });
    }
    else if (modal === 'member') {
        if (members.some(m => m.email === v('email')))
            return fail('Участник уже существует');
        members.push({
            name: v('email').split('@')[0],
            email: v('email'),
            roles: [v('role')]
        });
    }
    else if (modal === 'new-release') {
        if (releases.some(r => r.version === v('version')))
            return fail('Релиз уже существует');
        releases.unshift({
            version: v('version'),
            date: v('date'),
            published: ''
        });
    }
    else if (modal === 'publish') {
        const r = releases.find(r => r.version === publishVersion);
        if (r && !current().some(b => b.release === r.version && !['Verified', 'Rejected'].includes(b.status)))
            r.published = v('date');
    }
    save();
    modal = '';
    render();
});
window.addEventListener('hashchange', () => {
    modal = '';
    render();
});
window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal) {
        modal = '';
        render();
    }
});
if (!location.hash)
    location.hash = '/bugs';
render();
