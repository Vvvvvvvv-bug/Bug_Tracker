import { loadBugs, saveBugs, searchBugs, escapeHtml as e, statuses, priorities } from './data.ts';
import type { Bug, Priority } from './data.ts';
import bugIcon from './favicon.svg';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Не найден элемент страницы #app.');
const root: HTMLDivElement = app;
let storage: Storage | null;
try { storage = localStorage; } catch { storage = null; }
let bugs = loadBugs(storage);
let query = '';
let status = '';

function date(value: string): string {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString('ru-RU') : 'Не задан';
}
function badge(value: string): string {
  const style = value === 'In Progress' ? 'working' : value === 'Reopened' ? 'reopened' : 'open';
  return `<span class="status ${style}">${e(value)}</span>`;
}
function options(values: readonly string[]): string {
  return values.map(value => `<option>${e(value)}</option>`).join('');
}
function heading(title: string, action = ''): string {
  return `<div class="page-heading"><h1>${title}</h1>${action}</div>`;
}
function table(): string {
  const found = searchBugs(bugs, query, status);
  if (!found.length) return '<div class="empty"><h3>Ничего не найдено</h3><p>Измените запрос или выберите другой статус.</p></div>';
  return `<div class="table-scroll"><table><thead><tr><th>№</th><th>Название</th><th>Статус</th><th>Приоритет</th><th>Исполнитель</th><th>Дедлайн</th></tr></thead><tbody>
    ${found.map(b => `<tr><td class="number">#${b.id}</td><td class="bug-title"><a href="#/bug/${b.id}">${e(b.title)}</a></td><td>${badge(b.status)}</td><td>${e(b.priority)}</td><td>${e(b.assignee || 'Не назначен')}</td><td class="date">${date(b.deadline)}</td></tr>`).join('')}
    </tbody></table></div><p class="table-caption">Показано ${found.length} из ${bugs.length}</p>`;
}
function list(): string {
  return heading('Баги проекта', '<a class="button primary" href="#/new">Добавить баг</a>')
    + `<div class="filters"><input id="search" type="search" aria-label="Поиск багов" placeholder="Номер или название бага" value="${e(query)}">
      <select id="status" aria-label="Статус"><option value="">Все статусы</option>${statuses.map(value => `<option ${value === status ? 'selected' : ''}>${value}</option>`).join('')}</select></div>
      <section id="bug-list" aria-label="Список багов">${table()}</section>`;
}
function detail(id: number): string {
  const b = bugs.find(item => item.id === id);
  if (!b) return heading('Баг не найден') + '<a href="#/bugs">К списку багов</a>';
  return `<a class="back-link" href="#/bugs">К списку багов</a>${heading(`#${b.id} ${e(b.title)}`)}
    <div class="detail-labels">${badge(b.status)}<span>${e(b.priority)} приоритет</span></div>
    <article class="bug-description">${section('Что происходит', b.description)}${section('Шаги воспроизведения', b.steps)}${section('Ожидаемый результат', b.expected)}
    <dl><div><dt>Исполнитель</dt><dd>${e(b.assignee || 'Не назначен')}</dd></div><div><dt>Дедлайн</dt><dd>${date(b.deadline)}</dd></div></dl></article>`;
}
function section(title: string, text: string): string {
  return `<section class="description-section"><h3>${title}</h3><p>${e(text)}</p></section>`;
}
function form(): string {
  return `<a class="back-link" href="#/bugs">К списку багов</a>${heading('Новый баг')}
    <form id="bug-form" class="bug-form"><p id="form-error" role="alert"></p>
      <label for="title">Название *</label><input id="title" name="title" required minlength="5" maxlength="150">
      <label for="description">Что происходит *</label><textarea id="description" name="description" required maxlength="3000"></textarea>
      <label for="steps">Шаги воспроизведения *</label><textarea id="steps" name="steps" required maxlength="3000" placeholder="Каждый шаг с новой строки"></textarea>
      <label for="expected">Ожидаемый результат *</label><textarea id="expected" name="expected" required maxlength="3000"></textarea>
      <label for="priority">Приоритет</label><select id="priority" name="priority">${options(priorities)}</select>
      <div class="form-actions"><a class="button" href="#/bugs">Отмена</a><button class="button primary" type="submit">Добавить баг</button></div>
    </form>`;
}
function render(): void {
  const path = location.hash.slice(2).split('/');
  const page = ['new', 'bug', 'releases', 'members'].includes(path[0]) ? path[0] : 'bugs';
  let content: string;
  if (page === 'new') content = form();
  else if (page === 'bug') content = detail(Number(path[1]));
  else if (page === 'releases') content = heading('Релизы') + '<div class="table-scroll"><table><thead><tr><th>Версия</th><th>Плановая дата</th><th>Статус</th></tr></thead><tbody><tr><td>v1.1</td><td>26.11.2026</td><td>Запланирован</td></tr></tbody></table></div>';
  else if (page === 'members') content = heading('Участники') + '<div class="table-scroll"><table><thead><tr><th>Имя</th><th>Роль</th></tr></thead><tbody><tr><td>Анна</td><td>Lead</td></tr><tr><td>Олег</td><td>QA</td></tr><tr><td>Ильдар</td><td>Dev</td></tr></tbody></table></div>';
  else content = list();
  root.innerHTML = `<header class="site-header"><div class="page-width"><a class="brand" href="#/bugs"><img src="${bugIcon}" width="28" height="28" alt="">Трекер багов</a></div></header>
    <div class="project-nav"><div class="page-width"><nav class="tabs" aria-label="Разделы проекта">
      ${[['bugs', 'Баги'], ['releases', 'Релизы'], ['members', 'Участники']].map(([key, title]) => `<a href="#/${key}" ${key === (['bug', 'new'].includes(page) ? 'bugs' : page) ? 'aria-current="page"' : ''}>${title}</a>`).join('')}
    </nav></div></div><main id="main" class="page-width content" tabindex="-1">${content}</main>`;
  const pageTitle = page === 'new' ? 'Новый баг' : page === 'releases' ? 'Релизы' : page === 'members' ? 'Участники' : 'Баги';
  document.title = `${pageTitle} · Трекер багов`;
}

document.addEventListener('input', event => {
  if (event.target instanceof HTMLInputElement && event.target.id === 'search') {
    query = event.target.value;
    const list = document.querySelector('#bug-list');
    if (list) list.innerHTML = table();
  }
});
document.addEventListener('change', event => {
  if (event.target instanceof HTMLSelectElement && event.target.id === 'status') {
    status = event.target.value;
    const list = document.querySelector('#bug-list');
    if (list) list.innerHTML = table();
  }
});
document.addEventListener('click', event => {
  if (event.target instanceof Element && event.target.closest('.skip-link')) {
    event.preventDefault(); document.querySelector<HTMLElement>('#main')?.focus();
  }
});
document.addEventListener('submit', event => {
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== 'bug-form') return;
  event.preventDefault();
  const values = new FormData(event.target);
  const field = (name: string): string => String(values.get(name) || '').trim();
  const error = document.querySelector<HTMLParagraphElement>('#form-error');
  if (field('title').length < 5 || !field('description') || !field('steps') || !field('expected')) {
    if (error) error.textContent = 'Заполните обязательные поля. Название должно содержать не менее 5 символов.';
    return;
  }
  const priority = field('priority');
  if (!priorities.some(value => value === priority)) return;
  const added: Bug = { id: Math.max(0, ...bugs.map(b => b.id)) + 1, title: field('title'), description: field('description'), steps: field('steps'), expected: field('expected'), priority: priority as Priority, status: 'Open', assignee: '', deadline: '' };
  if (!saveBugs(storage, [...bugs, added])) {
    if (error) error.textContent = 'Браузер не разрешает сохранить данные. Разрешите локальное хранение и повторите попытку.';
    return;
  }
  bugs.push(added); query = ''; status = ''; location.hash = `/bug/${added.id}`;
});
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
if (!location.hash || location.hash === '#main') location.hash = '/bugs';
render();
