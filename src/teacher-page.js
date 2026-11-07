import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import './profile-page.css';
import './teacher-page.css';
import { supabase } from './supabase-client.js';
import { requireRole } from './role-access.js';
import { renderRoleNavigation } from './role-navigation.js';

const app = document.querySelector('#teacher-app');
app.innerHTML = `
  <div class="profile-page-shell teacher-page-shell min-vh-100 d-flex flex-column">
    <header class="site-header"><div id="role-navigation"></div></header>
    <div class="container flex-grow-1 py-4 py-md-5">
      <section class="teacher-hero mb-4" aria-labelledby="teacher-title">
        <div>
          <p class="eyebrow mb-2">Учителско пространство</p>
          <h1 id="teacher-title" class="display-6 mb-2">Добре дошли</h1>
          <p id="teacher-status" class="mb-0" role="status" aria-live="polite">Проверяваме достъпа...</p>
        </div>
        <a class="btn teacher-button-secondary" href="#teacher-assignments">Към моите задания</a>
      </section>

      <div id="teacher-content" hidden>
        <nav class="teacher-section-nav mb-4" aria-label="Секции в учителското пространство">
          <a href="#teacher-dashboard">Табло</a>
          <a href="#teacher-students">Моите ученици</a>
          <a href="#teacher-assignments">Моите задания</a>
          <a href="#teacher-routes">Предадени маршрути</a>
          <a href="#teacher-publications">Предложения за публикация</a>
          <a href="#teacher-connection">Свързване</a>
        </nav>

        <section id="teacher-dashboard" class="teacher-section mb-4" aria-labelledby="dashboard-title">
          <div class="teacher-section-heading">
            <div><p class="eyebrow mb-1">Общ преглед</p><h2 id="dashboard-title" class="h3 mb-0">Учителско табло</h2></div>
            <button id="teacher-refresh" class="btn teacher-button-secondary" type="button">Обнови данните</button>
          </div>
          <div id="teacher-metrics" class="teacher-metrics" aria-live="polite"><p class="teacher-muted">Зареждаме обобщението…</p></div>
        </section>

        <section id="teacher-students" class="teacher-section mb-4" aria-labelledby="students-title">
          <div class="teacher-section-heading"><div><p class="eyebrow mb-1">Връзки</p><h2 id="students-title" class="h3 mb-0">Моите ученици</h2></div></div>
          <div id="teacher-student-list"><p class="teacher-muted">Зареждаме достъпните идентификатори…</p></div>
        </section>

        <section id="teacher-assignments" class="teacher-section mb-4" aria-labelledby="assignments-title">
          <div class="teacher-section-heading"><div><p class="eyebrow mb-1">Индивидуална работа</p><h2 id="assignments-title" class="h3 mb-0">Моите задания</h2></div></div>
          <form id="teacher-create-assignment" class="teacher-form teacher-create-form">
            <h3 class="h5">Ново задание</h3>
            <label class="form-label" for="new-assignment-title">Заглавие</label>
            <input class="form-control" id="new-assignment-title" name="title" maxlength="180" required>
            <label class="form-label mt-3" for="new-assignment-instructions">Инструкции</label>
            <textarea class="form-control" id="new-assignment-instructions" name="instructions" rows="3" maxlength="10000"></textarea>
            <p class="teacher-muted small mt-2 mb-3">Заданието ще се създаде като чернова. Получателите се добавят поотделно, а публикуването е отделно действие.</p>
            <div class="teacher-form-actions"><button class="btn teacher-button-primary" type="submit">Създай чернова</button><span class="teacher-operation-status" data-create-status role="status" aria-live="polite"></span></div>
          </form>
          <div id="teacher-assignment-list" class="teacher-card-list"><p class="teacher-muted">Зареждаме заданията…</p></div>
        </section>

        <section id="teacher-routes" class="teacher-section mb-4" aria-labelledby="routes-title">
          <div class="teacher-section-heading"><div><p class="eyebrow mb-1">Ученически работи</p><h2 id="routes-title" class="h3 mb-0">Маршрути на свързани ученици</h2></div></div>
          <div id="teacher-route-list" class="teacher-card-list"><p class="teacher-muted">Зареждаме маршрутите…</p></div>
        </section>

        <section id="teacher-publications" class="teacher-section mb-4" aria-labelledby="publications-title">
          <div class="teacher-section-heading"><div><p class="eyebrow mb-1">Публична лаборатория</p><h2 id="publications-title" class="h3 mb-0">Моите предложения</h2></div></div>
          <div id="teacher-publication-list" class="teacher-card-list"><p class="teacher-muted">Зареждаме предложенията…</p></div>
        </section>

        <section id="teacher-connection" class="teacher-section" aria-labelledby="connection-title">
          <div class="teacher-section-heading"><div><p class="eyebrow mb-1">Свързване</p><h2 id="connection-title" class="h3 mb-0">Информация за свързване</h2></div></div>
          <p>Генерирайте код и го предоставете на учениците, които трябва да се свържат с вас.</p>
          <p class="teacher-notice teacher-notice-warning">Генерирането на нов код обезсилва предишния. Учениците, които още не са се присъединили, трябва да използват най-новия код.</p>
          <div class="teacher-form-actions">
            <button id="teacher-generate-join-code" class="btn teacher-button-primary" data-operation="rotate-join-code" type="button">Генерирай код за свързване</button>
            <span id="teacher-join-code-status" class="teacher-operation-status" role="status" aria-live="polite"></span>
          </div>
          <div id="teacher-join-code-result" class="teacher-join-code-result" hidden>
            <div><span class="teacher-muted small d-block">Вашият код за свързване</span><code id="teacher-join-code-value" class="teacher-join-code-value"></code></div>
            <button id="teacher-copy-join-code" class="btn teacher-button-secondary" type="button" disabled>Копирай кода</button>
          </div>
        </section>
      </div>
    </div>
  </div>
`;

const statusElement = document.querySelector('#teacher-status');
const contentElement = document.querySelector('#teacher-content');
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));
const formatDate = (value) => value ? new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
const routeStatusLabel = (value) => ({ draft: 'Чернова', submitted: 'Предаден', reviewed: 'Прегледан' }[value] || value || 'Неизвестен');
const assignmentStatusLabel = (value) => ({ draft: 'Чернова', published: 'Публикувано', closed: 'Затворено' }[value] || value || 'Неизвестен');
const publicationStatusLabel = (value) => ({ proposed: 'Предложена', approved: 'Одобрена', rejected: 'Отхвърлена' }[value] || value || 'Неизвестен');
const metricValue = (value, error) => error ? 'Недостъпно' : String(value);
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const operationLocks = new Set();
let generatedTeacherJoinCode = '';
let teacherId = null;
let assignments = [];
let recipients = [];
let connectedStudents = [];
let routes = [];
let reviews = [];
let publications = [];
let sectionErrors = {};
const recipientBatchStates = new Map();

function setOperationStatus(element, message, kind = '') {
  if (!element) return;
  element.textContent = message;
  element.className = `teacher-operation-status${kind ? ` is-${kind}` : ''}`;
}

function setBusy(key, formOrButton, busy) {
  if (busy) operationLocks.add(key);
  else operationLocks.delete(key);
  if (!formOrButton) return;
  formOrButton.querySelectorAll('button[type="submit"], button[data-operation]').forEach((button) => {
    if (busy) {
      button.dataset.wasDisabled = String(button.disabled);
      button.disabled = true;
    } else {
      button.disabled = button.dataset.wasDisabled === 'true';
      delete button.dataset.wasDisabled;
    }
  });
}

async function loadSection(name, query) {
  try {
    const result = await query();
    if (result.error) throw result.error;
    sectionErrors[name] = null;
    return result.data || [];
  } catch (error) {
    sectionErrors[name] = error;
    return null;
  }
}

async function refreshData() {
  const refreshButton = document.querySelector('#teacher-refresh');
  refreshButton.disabled = true;
  refreshButton.textContent = 'Обновяване…';
  sectionErrors = {};

  const [assignmentRows, routeRows, reviewRows, publicationRows, connectedStudentRows] = await Promise.all([
    loadSection('assignments', () => supabase.from('assignments').select('id, teacher_id, title, instructions, worksheet_template, status, created_at, published_at').eq('teacher_id', teacherId).order('created_at', { ascending: false })),
    loadSection('routes', () => supabase.from('routes').select('id, student_id, assignment_id, title, selected_stops, annotation, status, created_at, updated_at').order('created_at', { ascending: false })),
    loadSection('reviews', () => supabase.from('teacher_reviews').select('id, route_id, teacher_id, achievement_level, feedback, created_at').eq('teacher_id', teacherId).order('created_at', { ascending: false })),
    loadSection('publications', () => supabase.from('publications').select('id, route_id, status, public_title, public_description, created_at').eq('proposed_by', teacherId).order('created_at', { ascending: false })),
    loadSection('connectedStudents', () => supabase.rpc('get_my_connected_students'))
  ]);

  assignments = assignmentRows || [];
  routes = routeRows || [];
  reviews = reviewRows || [];
  publications = publicationRows || [];
  connectedStudents = (connectedStudentRows || [])
    .map((row) => row.student_id)
    .filter((studentId) => isUuid(studentId));
  const assignmentIds = assignments.map(({ id }) => id);
  if (assignmentIds.length) {
    recipients = await loadSection('recipients', () => supabase.from('assignment_recipients').select('id, assignment_id, student_id, assigned_at').in('assignment_id', assignmentIds)) || [];
  } else if (!sectionErrors.assignments) {
    recipients = [];
    sectionErrors.recipients = null;
  } else {
    recipients = [];
    sectionErrors.recipients = sectionErrors.assignments;
  }

  if (!sectionErrors.recipients) {
    const recipientIdsByAssignment = new Map();
    recipients.forEach(({ assignment_id: assignmentId, student_id: studentId }) => {
      if (!recipientIdsByAssignment.has(assignmentId)) recipientIdsByAssignment.set(assignmentId, new Set());
      recipientIdsByAssignment.get(assignmentId).add(studentId);
    });
    for (const [assignmentId, state] of recipientBatchStates) {
      const existingIds = recipientIdsByAssignment.get(assignmentId) || new Set();
      state.pendingIds = state.pendingIds.filter((studentId) => !existingIds.has(studentId));
      if (!state.pendingIds.length) {
        state.kind = 'success';
        state.message = 'Списъкът с получатели е потвърден.';
      }
    }
  }

  renderDashboard();
  renderStudents();
  renderAssignments();
  renderRoutes();
  renderPublications();
  const failedSections = Object.entries(sectionErrors).filter(([, error]) => error);
  statusElement.textContent = failedSections.length
    ? `Част от данните не се заредиха (${failedSections.map(([name]) => name).join(', ')}). Останалите секции остават достъпни.`
    : 'Данните са обновени.';
  statusElement.className = failedSections.length ? 'teacher-status-warning' : 'teacher-status-success';
  refreshButton.disabled = false;
  refreshButton.textContent = 'Обнови данните';
}

function renderDashboard() {
  const routeError = sectionErrors.routes;
  const reviewError = sectionErrors.reviews;
  const assignmentError = sectionErrors.assignments;
  const submittedRoutes = routes.filter((route) => route.status === 'submitted');
  const reviewedRouteIds = new Set(reviews.map((review) => review.route_id));
  const pendingReviews = submittedRoutes.filter((route) => !reviewedRouteIds.has(route.id));
  const metrics = [
    ['Мои задания', metricValue(assignments.length, assignmentError)],
    ['Предадени маршрути', metricValue(routes.filter((route) => route.status === 'submitted').length, routeError)],
    ['Очакват преглед', metricValue(pendingReviews.length, routeError || reviewError)],
    ['Завършени прегледи', metricValue(reviews.length, reviewError)]
  ];
  document.querySelector('#teacher-metrics').innerHTML = metrics.map(([label, value]) => `
    <article class="teacher-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>
  `).join('');
}

function renderStudents() {
  const list = document.querySelector('#teacher-student-list');
  if (sectionErrors.connectedStudents) {
    list.innerHTML = '<div class="teacher-notice teacher-notice-error">Списъкът със свързани ученици не се зареди. Опитайте „Обнови данните“; не използваме директна заявка към чужди профили.</div>';
    return;
  }
  list.innerHTML = `
    <div class="teacher-notice teacher-notice-info">
      <p>Показваме UUID, върнати от защитената функция за ученици, свързани с текущия ви профил.</p>
      ${connectedStudents.length ? `<ul class="teacher-id-list mb-0">${connectedStudents.map((id) => `<li><code>${escapeHtml(id)}</code></li>`).join('')}</ul>` : '<p class="mb-0">Няма свързани ученици.</p>'}
    </div>
  `;
}

function renderAssignments() {
  const list = document.querySelector('#teacher-assignment-list');
  if (sectionErrors.assignments) {
    list.innerHTML = '<div class="teacher-notice teacher-notice-error">Заданията не се заредиха. Проверете връзката и опитайте „Обнови данните“.</div>';
    return;
  }
  if (!assignments.length) {
    list.innerHTML = '<div class="teacher-empty-state">Все още няма създадени задания.</div>';
    return;
  }
  const recipientsUnavailable = Boolean(sectionErrors.recipients);
  const connectedStudentsUnavailable = Boolean(sectionErrors.connectedStudents);
  list.innerHTML = assignments.map((assignment) => {
    const assignmentRecipients = recipients.filter((recipient) => recipient.assignment_id === assignment.id);
    const isDraft = assignment.status === 'draft';
    const recipientBatchState = recipientBatchStates.get(assignment.id);
    const hasUnresolvedRecipients = Boolean(recipientBatchState?.pendingIds.length);
    const canPublish = isDraft && !recipientsUnavailable && assignmentRecipients.length > 0 && !hasUnresolvedRecipients;
    const assignedStudentIds = new Set(assignmentRecipients.map(({ student_id: studentId }) => studentId));
    const selectableStudents = connectedStudents.filter((studentId) => !assignedStudentIds.has(studentId));
    return `
      <article class="teacher-card" data-assignment-card="${escapeHtml(assignment.id)}">
        <div class="teacher-card-heading"><div><span class="teacher-badge ${isDraft ? 'is-draft' : ''}">${escapeHtml(assignmentStatusLabel(assignment.status))}</span><h3 class="h5 mt-2 mb-1">${escapeHtml(assignment.title)}</h3><p class="teacher-muted mb-0">Създадено ${escapeHtml(formatDate(assignment.created_at))}</p></div></div>
        <p class="teacher-preserve-lines mt-3 mb-3">${escapeHtml(assignment.instructions || 'Няма добавени инструкции.')}</p>
        ${isDraft ? `
          <details class="teacher-disclosure"><summary>Редактирай черновата</summary>
            <form class="teacher-form teacher-edit-assignment" data-assignment-id="${escapeHtml(assignment.id)}">
              <label class="form-label" for="assignment-title-${escapeHtml(assignment.id)}">Заглавие</label>
              <input class="form-control" id="assignment-title-${escapeHtml(assignment.id)}" name="title" value="${escapeHtml(assignment.title)}" maxlength="180" required>
              <label class="form-label mt-3" for="assignment-instructions-${escapeHtml(assignment.id)}">Инструкции</label>
              <textarea class="form-control" id="assignment-instructions-${escapeHtml(assignment.id)}" name="instructions" rows="3" maxlength="10000">${escapeHtml(assignment.instructions)}</textarea>
              <div class="teacher-form-actions mt-3"><button class="btn teacher-button-secondary" type="submit">Запази черновата</button><span class="teacher-operation-status" data-edit-status role="status" aria-live="polite"></span></div>
            </form>
          </details>
          <div class="teacher-recipient-block"><h4 class="h6">Индивидуални получатели <span class="teacher-muted">(${recipientsUnavailable ? 'непроверени' : assignmentRecipients.length})</span></h4>
            ${recipientsUnavailable ? '<p class="teacher-muted">Получателите не се заредиха. Обновете данните преди публикуване.</p>' : assignmentRecipients.length ? `<ul class="teacher-recipient-list">${assignmentRecipients.map((recipient) => `<li><code>${escapeHtml(recipient.student_id)}</code><button class="btn btn-sm teacher-remove-button" data-operation="remove-recipient" data-assignment-id="${escapeHtml(assignment.id)}" data-student-id="${escapeHtml(recipient.student_id)}" type="button">Премахни</button></li>`).join('')}</ul>` : '<p class="teacher-muted">Няма добавени получатели.</p>'}
            ${connectedStudentsUnavailable ? '<div class="teacher-notice teacher-notice-error">Изборът е временно недостъпен, защото списъкът със свързани ученици не се зареди.</div>' : selectableStudents.length ? `
              <form class="teacher-form teacher-add-recipient" data-assignment-id="${escapeHtml(assignment.id)}">
                <fieldset class="teacher-student-picker">
                  <legend class="form-label">Изберете един или повече свързани ученици</legend>
                  ${selectableStudents.map((studentId) => `<label class="teacher-student-option"><input class="form-check-input" type="checkbox" name="studentIds" value="${escapeHtml(studentId)}" ${recipientBatchState?.pendingIds.includes(studentId) ? 'checked' : ''}><code>${escapeHtml(studentId)}</code></label>`).join('')}
                </fieldset>
                <p class="teacher-muted small mt-2 mb-2">Показват се само ID, върнати от get_my_connected_students(). Всеки ученик се добавя отделно и backend повторно проверява свързаността.</p>
                ${hasUnresolvedRecipients ? '<p class="teacher-notice teacher-notice-warning mb-2">Някои получатели не са потвърдени. Те са избрани отново; разрешете ги преди публикуване.</p>' : ''}
                <div class="teacher-form-actions"><button class="btn teacher-button-secondary" type="submit">Добави избраните</button><span class="teacher-operation-status${recipientBatchState?.kind ? ` is-${recipientBatchState.kind}` : ''}" data-recipient-status role="status" aria-live="polite">${escapeHtml(recipientBatchState?.message || '')}</span></div>
              </form>
            ` : '<p class="teacher-muted mb-0">' + (connectedStudents.length ? 'Всички свързани ученици вече са добавени към тази чернова.' : 'Няма свързани ученици за избор.') + '</p>'}
          </div>
          <label class="teacher-confirm-recipients mt-3"><input class="form-check-input" type="checkbox" data-publish-confirm="${escapeHtml(assignment.id)}" ${canPublish ? '' : 'disabled'}><span>Потвърждавам, че проверих списъка и всички желани получатели са добавени успешно.</span></label>
          <div class="teacher-form-actions mt-2"><button class="btn teacher-button-primary" data-operation="publish-assignment" data-assignment-id="${escapeHtml(assignment.id)}" type="button" disabled>Публикувай заданието</button><span class="teacher-muted small">${recipientsUnavailable ? 'Публикуването е спряно, защото получателите не са проверени.' : hasUnresolvedRecipients ? 'Публикуването е спряно до успешно повторение на неуспешните добавяния.' : assignmentRecipients.length ? 'След потвърждение публикуването заключва получателите.' : 'Добавете поне един получател преди публикуване.'}</span></div>
        ` : `<div class="teacher-assignment-meta"><span>${escapeHtml(assignmentRecipients.length)} записани получатели</span>${assignment.published_at ? `<span>Публикувано ${escapeHtml(formatDate(assignment.published_at))}</span>` : ''}</div>`}
      </article>
    `;
  }).join('');
}

function renderStops(stops) {
  if (stops == null) return 'Няма записани точки.';
  const formatted = typeof stops === 'string' ? stops : JSON.stringify(stops, null, 2);
  return `<pre class="teacher-route-data">${escapeHtml(formatted)}</pre>`;
}

function renderRoutes() {
  const list = document.querySelector('#teacher-route-list');
  if (sectionErrors.routes) {
    list.innerHTML = '<div class="teacher-notice teacher-notice-error">Маршрутите не се заредиха. Останалите секции могат да се използват.</div>';
    return;
  }
  if (!routes.length) {
    list.innerHTML = '<div class="teacher-empty-state">Няма достъпни маршрути от свързани ученици.</div>';
    return;
  }
  const assignmentById = new Map(assignments.map((assignment) => [assignment.id, assignment]));
  const reviewByRouteId = new Map(reviews.map((review) => [review.route_id, review]));
  const publicationByRouteId = new Map(publications.map((publication) => [publication.route_id, publication]));
  list.innerHTML = routes.map((route) => {
    const review = reviewByRouteId.get(route.id);
    const publication = publicationByRouteId.get(route.id);
    const assignment = route.assignment_id ? assignmentById.get(route.assignment_id) : null;
    const canReview = route.status === 'submitted' && !review;
    const canPropose = route.status === 'reviewed' && Boolean(review) && !publication && !sectionErrors.publications;
    return `
      <article class="teacher-card" data-route-card="${escapeHtml(route.id)}">
        <div class="teacher-card-heading"><div><span class="teacher-badge ${route.status === 'submitted' ? 'is-pending' : ''}">${escapeHtml(routeStatusLabel(route.status))}</span><h3 class="h5 mt-2 mb-1">${escapeHtml(route.title || 'Маршрут без заглавие')}</h3><p class="teacher-muted mb-0">Ученик <code>${escapeHtml(route.student_id)}</code> · създаден ${escapeHtml(formatDate(route.created_at))}</p></div></div>
        <p class="teacher-muted mt-2 mb-3">${route.assignment_id ? `Задание: ${escapeHtml(assignment?.title || 'недостъпно')} <span class="small">(${escapeHtml(route.assignment_id)})</span>` : 'Свободен маршрут без задание'}</p>
        <details class="teacher-disclosure"><summary>Прегледай маршрута</summary><div class="teacher-route-content"><p class="teacher-preserve-lines"><strong>Бележка:</strong> ${escapeHtml(route.annotation || 'Няма бележка.')}</p><strong>Точки</strong>${renderStops(route.selected_stops)}</div></details>
        ${review ? `<div class="teacher-review-summary"><h4 class="h6">Окончателен преглед · ${escapeHtml(review.achievement_level)}</h4><p class="teacher-preserve-lines mb-1">${escapeHtml(review.feedback || 'Няма допълнителен коментар.')}</p><span class="teacher-muted small">${escapeHtml(formatDate(review.created_at))}</span></div>` : ''}
        ${canReview ? `<details class="teacher-disclosure"><summary>Остави окончателен преглед</summary>
          <form class="teacher-form teacher-review-form" data-route-id="${escapeHtml(route.id)}">
            <label class="form-label" for="review-level-${escapeHtml(route.id)}">Ниво на постижение</label>
            <select class="form-select" id="review-level-${escapeHtml(route.id)}" name="achievementLevel" required><option value="" selected disabled>Изберете ниво</option><option value="beginning">В началото</option><option value="developing">В развитие</option><option value="achieved">Постигнато</option><option value="excellent">Отлично</option></select>
            <label class="form-label mt-3" for="review-feedback-${escapeHtml(route.id)}">Обратна връзка</label><textarea class="form-control" id="review-feedback-${escapeHtml(route.id)}" name="feedback" rows="4" maxlength="10000"></textarea>
            <p class="teacher-muted small mt-2">Прегледът е окончателен и не може да бъде подаден повторно.</p>
            <div class="teacher-form-actions"><button class="btn teacher-button-primary" type="submit">Запиши прегледа</button><span class="teacher-operation-status" data-review-status role="status" aria-live="polite"></span></div>
          </form>
        </details>` : ''}
        ${publication ? `<div class="teacher-review-summary"><h4 class="h6 mb-1">Предложение за публикация: ${escapeHtml(publicationStatusLabel(publication.status))}</h4><p class="mb-0">${escapeHtml(publication.public_title)}</p></div>` : sectionErrors.publications && route.status === 'reviewed' ? '<div class="teacher-notice teacher-notice-warning">Статусът на предложението не може да се провери; ново предложение е временно спряно.</div>' : canPropose ? `<details class="teacher-disclosure"><summary>Предложи за публичната лаборатория</summary>
          <form class="teacher-form teacher-proposal-form" data-route-id="${escapeHtml(route.id)}">
            <label class="form-label" for="proposal-title-${escapeHtml(route.id)}">Публично заглавие</label><input class="form-control" id="proposal-title-${escapeHtml(route.id)}" name="publicTitle" maxlength="180" required>
            <label class="form-label mt-3" for="proposal-description-${escapeHtml(route.id)}">Публично описание</label><textarea class="form-control" id="proposal-description-${escapeHtml(route.id)}" name="publicDescription" rows="3" maxlength="10000" required></textarea>
            <p class="teacher-muted small mt-2">Администраторът преглежда и одобрява предложението. Тук не се редактира публичната версия.</p>
            <div class="teacher-form-actions"><button class="btn teacher-button-secondary" type="submit">Изпрати предложение</button><span class="teacher-operation-status" data-proposal-status role="status" aria-live="polite"></span></div>
          </form>
        </details>` : route.status === 'reviewed' && review && !publication ? '<p class="teacher-muted small">Предложение не е достъпно за изпращане.</p>' : ''}
      </article>
    `;
  }).join('');
}

function renderPublications() {
  const list = document.querySelector('#teacher-publication-list');
  if (sectionErrors.publications) {
    list.innerHTML = '<div class="teacher-notice teacher-notice-error">Предложенията не се заредиха. Защитата срещу повторно предложение остава включена до успешно обновяване.</div>';
    return;
  }
  if (!publications.length) {
    list.innerHTML = '<div class="teacher-empty-state">Все още няма предложения за публикация.</div>';
    return;
  }
  list.innerHTML = publications.map((publication) => {
    const route = routes.find(({ id }) => id === publication.route_id);
    return `<article class="teacher-card"><div class="teacher-card-heading"><div><span class="teacher-badge">${escapeHtml(publicationStatusLabel(publication.status))}</span><h3 class="h5 mt-2 mb-1">${escapeHtml(publication.public_title)}</h3><p class="teacher-muted mb-0">${escapeHtml(publication.public_description || 'Няма описание.')}</p></div></div><p class="teacher-muted small mt-3 mb-0">${route ? `Маршрут ${escapeHtml(route.title || route.id)}` : `Маршрут ${escapeHtml(publication.route_id)}`} · ${escapeHtml(formatDate(publication.created_at))}</p></article>`;
  }).join('');
}

async function withOperation(key, formOrButton, action) {
  if (operationLocks.has(key)) return;
  setBusy(key, formOrButton, true);
  try {
    await action();
  } finally {
    setBusy(key, formOrButton, false);
  }
}

const generateTeacherJoinCodeButton = document.querySelector('#teacher-generate-join-code');
const teacherJoinCodeStatus = document.querySelector('#teacher-join-code-status');
const teacherJoinCodeResult = document.querySelector('#teacher-join-code-result');
const teacherJoinCodeValue = document.querySelector('#teacher-join-code-value');
const copyTeacherJoinCodeButton = document.querySelector('#teacher-copy-join-code');
const teacherJoinCodePattern = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/;

generateTeacherJoinCodeButton.addEventListener('click', async () => {
  if (operationLocks.has('rotate-join-code')) return;

  generatedTeacherJoinCode = '';
  teacherJoinCodeValue.textContent = '';
  teacherJoinCodeResult.hidden = true;
  copyTeacherJoinCodeButton.disabled = true;
  generateTeacherJoinCodeButton.disabled = true;

  await withOperation('rotate-join-code', generateTeacherJoinCodeButton, async () => {
    generateTeacherJoinCodeButton.textContent = 'Генериране…';
    setOperationStatus(teacherJoinCodeStatus, 'Генерираме нов код…');
    try {
      const { data, error } = await supabase.rpc('teacher_rotate_my_join_code');
      if (error) throw error;
      if (typeof data !== 'string' || !teacherJoinCodePattern.test(data)) {
        throw new Error('Полученият код е в неочакван формат.');
      }

      generatedTeacherJoinCode = data;
      teacherJoinCodeValue.textContent = generatedTeacherJoinCode;
      teacherJoinCodeResult.hidden = false;
      copyTeacherJoinCodeButton.disabled = false;
      setOperationStatus(teacherJoinCodeStatus, 'Кодът е генериран. Запазете го и го предоставете на учениците.', 'success');
    } catch (error) {
      setOperationStatus(teacherJoinCodeStatus, `Кодът не беше генериран: ${error?.message || 'Възникна неочаквана грешка.'}`, 'error');
    } finally {
      generateTeacherJoinCodeButton.textContent = 'Генерирай код за свързване';
      generateTeacherJoinCodeButton.disabled = false;
    }
  });
});

copyTeacherJoinCodeButton.addEventListener('click', async () => {
  if (!generatedTeacherJoinCode) return;
  try {
    await navigator.clipboard.writeText(generatedTeacherJoinCode);
    setOperationStatus(teacherJoinCodeStatus, 'Кодът е копиран.', 'success');
  } catch {
    setOperationStatus(teacherJoinCodeStatus, 'Копирането не е достъпно в този браузър. Можете да маркирате кода и да го копирате ръчно.', 'error');
  }
});

document.querySelector('#teacher-refresh').addEventListener('click', refreshData);
document.querySelector('#teacher-create-assignment').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('[data-create-status]');
  const formData = new FormData(form);
  const title = String(formData.get('title') || '').trim();
  const instructions = String(formData.get('instructions') || '').trim();
  if (!title) return;
  await withOperation('create-assignment', form, async () => {
    setOperationStatus(status, 'Създаваме чернова…');
    button.textContent = 'Създаване…';
    const { error } = await supabase.from('assignments').insert({ teacher_id: teacherId, title, instructions }).select('id').single();
    if (error) {
      setOperationStatus(status, `Черновата не беше потвърдена: ${error.message}. Обновете списъка преди повторен опит.`, 'error');
      await refreshData();
      return;
    }
    form.reset();
    setOperationStatus(status, 'Черновата е създадена. Добавете получатели поотделно.', 'success');
    await refreshData();
  });
});

document.querySelector('#teacher-assignment-list').addEventListener('submit', async (event) => {
  const form = event.target;
  if (form.matches('.teacher-edit-assignment')) {
    event.preventDefault();
    const assignmentId = form.dataset.assignmentId;
    const status = form.querySelector('[data-edit-status]');
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    const instructions = String(data.get('instructions') || '').trim();
    if (!title) return;
    await withOperation(`assignment-${assignmentId}`, document.querySelector(`[data-assignment-card="${assignmentId}"]`), async () => {
      setOperationStatus(status, 'Запазваме черновата…');
      const { data: updated, error } = await supabase.from('assignments').update({ title, instructions }).eq('id', assignmentId).eq('teacher_id', teacherId).eq('status', 'draft').select('id').maybeSingle();
      if (error || !updated) {
        setOperationStatus(status, error?.message || 'Черновата не е редактирана. Възможно е вече да не е чернова.', 'error');
        return;
      }
      setOperationStatus(status, 'Черновата е запазена.', 'success');
      await refreshData();
    });
  }
  if (form.matches('.teacher-add-recipient')) {
    event.preventDefault();
    const assignmentId = form.dataset.assignmentId;
    const status = form.querySelector('[data-recipient-status]');
    const selectedStudentIds = [...new Set(new FormData(form).getAll('studentIds').map((value) => String(value)))];
    if (sectionErrors.connectedStudents) {
      setOperationStatus(status, 'Списъкът със свързани ученици не е наличен. Обновете данните и опитайте отново.', 'error');
      return;
    }
    if (!selectedStudentIds.length) {
      setOperationStatus(status, 'Изберете поне един свързан ученик.', 'error');
      return;
    }
    if (selectedStudentIds.some((studentId) => !connectedStudents.includes(studentId) || !isUuid(studentId))) {
      setOperationStatus(status, 'Изборът съдържа ID извън списъка на свързаните ученици. Обновете данните.', 'error');
      return;
    }
    const pendingStudentIds = recipientBatchStates.get(assignmentId)?.pendingIds || [];
    if (pendingStudentIds.some((studentId) => !selectedStudentIds.includes(studentId))) {
      setOperationStatus(status, 'Оставете избрани всички неуспешни получатели, за да ги повторите преди публикуване.', 'error');
      return;
    }
    const assignedIds = new Set(recipients.filter((recipient) => recipient.assignment_id === assignmentId).map((recipient) => recipient.student_id));
    const studentIdsToAdd = selectedStudentIds.filter((studentId) => !assignedIds.has(studentId));
    if (!studentIdsToAdd.length) {
      setOperationStatus(status, 'Всички избрани ученици вече са получатели на това задание.', 'error');
      return;
    }
    await withOperation(`assignment-${assignmentId}`, document.querySelector(`[data-assignment-card="${assignmentId}"]`), async () => {
      const failedStudentIds = [];
      for (let index = 0; index < studentIdsToAdd.length; index += 1) {
        setOperationStatus(status, `Добавяме избраните ученици (${index + 1}/${studentIdsToAdd.length})…`);
        try {
          const { error } = await supabase.rpc('add_assignment_recipient', {
            p_assignment_id: assignmentId,
            p_student_id: studentIdsToAdd[index]
          });
          if (error) failedStudentIds.push(studentIdsToAdd[index]);
        } catch {
          failedStudentIds.push(studentIdsToAdd[index]);
        }
      }
      form.reset();
      const batchState = failedStudentIds.length
        ? {
          pendingIds: failedStudentIds,
          kind: 'error',
          message: `${failedStudentIds.length} от ${studentIdsToAdd.length} добавяния не бяха потвърдени. Неуспешните ID ще останат избрани; публикуването е блокирано до успешно повторение.`
        }
        : {
          pendingIds: [],
          kind: 'success',
          message: `${studentIdsToAdd.length} получатели са добавени успешно.`
        };
      recipientBatchStates.set(assignmentId, batchState);
      await refreshData();
    });
  }
});

document.querySelector('#teacher-assignment-list').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-operation]');
  if (!button) return;
  const assignmentId = button.dataset.assignmentId;
  if (button.dataset.operation === 'remove-recipient') {
    const studentId = button.dataset.studentId;
    if (!window.confirm('Да премахнем ли този ученик от черновата?')) return;
    await withOperation(`assignment-${assignmentId}`, button.closest('[data-assignment-card]'), async () => {
      button.textContent = 'Премахване…';
      const { data, error } = await supabase.rpc('remove_assignment_recipient', { p_assignment_id: assignmentId, p_student_id: studentId });
      if (error || data !== true) {
        window.alert(error ? `Получателят не е премахнат: ${error.message}` : 'Получателят не беше намерен; проверете актуалния списък.');
        await refreshData();
        return;
      }
      await refreshData();
    });
  }
  if (button.dataset.operation === 'publish-assignment') {
    const card = button.closest('[data-assignment-card]');
    const confirmation = card.querySelector(`[data-publish-confirm="${assignmentId}"]`);
    const recipientCount = recipients.filter((recipient) => recipient.assignment_id === assignmentId).length;
    if (!confirmation?.checked || sectionErrors.recipients || recipientCount === 0) return;
    if (!window.confirm('Публикуването заключва получателите на заданието. Продължавате ли?')) return;
    await withOperation(`assignment-${assignmentId}`, button.closest('[data-assignment-card]'), async () => {
      button.textContent = 'Публикуване…';
      const { error } = await supabase.rpc('publish_assignment', { p_assignment_id: assignmentId });
      if (error) {
        window.alert(`Заданието не е публикувано: ${error.message}`);
        await refreshData();
        return;
      }
      await refreshData();
    });
  }
});

document.querySelector('#teacher-assignment-list').addEventListener('change', (event) => {
  const confirmation = event.target;
  if (!confirmation.matches('[data-publish-confirm]')) return;
  const assignmentId = confirmation.dataset.publishConfirm;
  const publishButton = confirmation.closest('[data-assignment-card]').querySelector('[data-operation="publish-assignment"]');
  const recipientCount = recipients.filter((recipient) => recipient.assignment_id === assignmentId).length;
  publishButton.disabled = !confirmation.checked || sectionErrors.recipients || recipientCount === 0;
});

document.querySelector('#teacher-route-list').addEventListener('submit', async (event) => {
  const form = event.target;
  if (form.matches('.teacher-review-form')) {
    event.preventDefault();
    const routeId = form.dataset.routeId;
    const status = form.querySelector('[data-review-status]');
    const data = new FormData(form);
    const achievementLevel = String(data.get('achievementLevel') || '');
    const feedback = String(data.get('feedback') || '').trim();
    if (!['beginning', 'developing', 'achieved', 'excellent'].includes(achievementLevel)) {
      setOperationStatus(status, 'Изберете валидно ниво на постижение.', 'error');
      return;
    }
    await withOperation(`route-${routeId}`, document.querySelector(`[data-route-card="${routeId}"]`), async () => {
      setOperationStatus(status, 'Записваме окончателния преглед…');
      const { error } = await supabase.rpc('teacher_review_route', { p_route_id: routeId, p_achievement_level: achievementLevel, p_feedback: feedback });
      if (error) {
        setOperationStatus(status, `Прегледът не е записан: ${error.message}`, 'error');
        return;
      }
      setOperationStatus(status, 'Прегледът е записан.', 'success');
      await refreshData();
    });
  }
  if (form.matches('.teacher-proposal-form')) {
    event.preventDefault();
    const routeId = form.dataset.routeId;
    const status = form.querySelector('[data-proposal-status]');
    const data = new FormData(form);
    const publicTitle = String(data.get('publicTitle') || '').trim();
    const publicDescription = String(data.get('publicDescription') || '').trim();
    if (!publicTitle || !publicDescription) return;
    await withOperation(`route-${routeId}`, document.querySelector(`[data-route-card="${routeId}"]`), async () => {
      setOperationStatus(status, 'Изпращаме предложението…');
      const { error } = await supabase.rpc('propose_publication', { p_route_id: routeId, p_public_title: publicTitle, p_public_description: publicDescription });
      if (error) {
        setOperationStatus(status, `Предложението не е изпратено: ${error.message}`, 'error');
        return;
      }
      setOperationStatus(status, 'Предложението е изпратено за административен преглед.', 'success');
      await refreshData();
    });
  }
});

const teacher = await requireRole(supabase, ['teacher'], (message) => {
  statusElement.className = 'profile-status profile-status-error';
  statusElement.textContent = `Достъпът не може да бъде проверен: ${message}`;
});

if (teacher) {
  teacherId = teacher.profile.id;
  document.querySelector('#role-navigation').innerHTML = renderRoleNavigation('teacher', 'dashboard');
  contentElement.hidden = false;
  document.querySelector('#teacher-title').textContent = `Добре дошли, учителю`;
  await refreshData();
}
