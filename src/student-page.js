import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import './student-page.css';
import { supabase } from './supabase-client.js';
import { requireRole } from './role-access.js';
import { renderRoleNavigation } from './role-navigation.js';

const arcgisUrl =
  'https://www.arcgis.com/apps/instant/nearby/index.html?appid=5e8bd330b9ae4519be093bd70132b790';
const app = document.querySelector('#student-app');

app.innerHTML = `
  <div class="student-page-shell min-vh-100 d-flex flex-column">
    <header class="site-header">
      <div id="role-navigation"></div>
    </header>

    <main class="container flex-grow-1 py-4 py-md-5">
      <section class="student-intro mb-4" aria-labelledby="student-page-title">
        <p class="eyebrow mb-2">Твоето картографско приключение</p>
        <h1 id="student-page-title">Моят работен лист</h1>
        <p id="student-status" class="student-status mb-0" role="status" aria-live="polite">
          Проверяваме профила ти...
        </p>
      </section>

      <section class="student-map-card mb-4" aria-labelledby="student-map-title">
        <div class="student-section-heading">
          <div>
            <p class="eyebrow mb-1">Интерактивна карта</p>
            <h2 id="student-map-title" class="h4 mb-0">Открий места за своя маршрут</h2>
          </div>
          <a class="student-external-link" href="${arcgisUrl}" target="_blank" rel="noopener noreferrer">
            Отвори в нов раздел
          </a>
        </div>
        <div class="student-map-frame-wrap">
          <iframe
            id="student-map"
            title="Интерактивна ArcGIS карта на България"
            src="${arcgisUrl}"
            loading="eager"
            allow="geolocation"
            allowfullscreen
          >iFrames не се поддържат на тази страница.</iframe>
          <div id="student-map-fallback" class="student-map-fallback" role="alert" hidden>
            <p class="mb-3">Картата не се зареди. Можеш да я отвориш в нов раздел или да опиташ отново.</p>
            <div class="d-flex flex-wrap gap-2">
              <a class="btn btn-primary" href="${arcgisUrl}" target="_blank" rel="noopener noreferrer">
                Отвори картата
              </a>
              <button id="student-map-retry" class="btn btn-outline-secondary" type="button">
                Опитай отново
              </button>
            </div>
          </div>
        </div>
        <p class="student-map-help mb-0">
          Запиши данните за избраните места в работния лист. Те не се извличат автоматично от картата.
        </p>
      </section>

      <div id="student-error" class="student-message student-message-error" role="alert" hidden></div>

      <section id="student-tools" class="student-support-grid mb-4" aria-label="Ученически инструменти" hidden>
        <section class="student-form-card student-join-card" aria-labelledby="join-teacher-title">
          <div class="student-section-heading">
            <div>
              <p class="eyebrow mb-1">Връзка с учител</p>
              <h2 id="join-teacher-title" class="h4 mb-0">Моят учител</h2>
            </div>
          </div>
          <div class="student-card-body">
            <p id="teacher-link-status" class="student-muted" role="status" aria-live="polite">Проверяваме връзката с учител...</p>
            <form id="join-teacher-form" hidden>
              <label class="form-label" for="teacher-join-code">Код за присъединяване</label>
              <div class="student-inline-form">
                <input id="teacher-join-code" class="form-control" name="join_code" type="text" maxlength="11" autocomplete="off" required />
                <button id="join-teacher-button" class="student-secondary-action" type="submit">Присъедини се към учител</button>
              </div>
              <div id="teacher-link-message" class="student-message" role="status" aria-live="polite" hidden></div>
            </form>
          </div>
        </section>

        <section class="student-form-card student-assignments-card" aria-labelledby="assignments-title">
          <div class="student-section-heading">
            <div>
              <p class="eyebrow mb-1">Индивидуална работа</p>
              <h2 id="assignments-title" class="h4 mb-0">Моите задания</h2>
            </div>
          </div>
          <div id="assignments-list" class="student-card-body">
            <p class="student-muted">Зареждаме заданията...</p>
          </div>
        </section>
      </section>

      <section id="student-workspace" hidden>
        <div class="student-layout">
          <section class="student-form-card" aria-labelledby="worksheet-title">
            <div class="student-section-heading">
              <div>
                <p class="eyebrow mb-1">Твоята работа</p>
                <h2 id="worksheet-title" class="h4 mb-0">Създай маршрут</h2>
              </div>
              <span id="worksheet-mode" class="student-mode">Нова чернова</span>
            </div>

            <form id="route-form" novalidate>
              <div class="mb-3">
                <label class="form-label" for="route-title">Име на маршрута</label>
                <input id="route-title" class="form-control" name="title" type="text" maxlength="160" required />
              </div>

              <fieldset class="stops-fieldset">
                <legend class="form-label">Избрани места</legend>
                <p class="student-field-help">Добавяй толкова места, колкото са нужни за твоя маршрут.</p>
                <div id="stops-list"></div>
                <button id="add-stop" class="student-secondary-action" type="button">+ Добави място</button>
              </fieldset>

              <div class="mb-3">
                <label class="form-label" for="route-annotation">Анотация на ученика</label>
                <textarea id="route-annotation" class="form-control" name="annotation" rows="5" maxlength="5000"></textarea>
              </div>

              <div id="form-message" class="student-message" role="status" aria-live="polite" hidden></div>
              <div class="student-form-actions">
                <button id="save-draft" class="student-primary-action" type="submit">Запази чернова</button>
                <button id="submit-route" class="student-submit-action" type="button">Предай за проверка</button>
                <button id="cancel-edit" class="student-secondary-action" type="button" hidden>Нова работа</button>
              </div>
            </form>
          </section>

          <section class="student-routes-card" aria-labelledby="routes-title">
            <div class="student-section-heading">
              <div>
                <p class="eyebrow mb-1">Твоите маршрути</p>
                <h2 id="routes-title" class="h4 mb-0">Запазени работи</h2>
              </div>
            </div>
            <div id="routes-list" class="routes-list">
              <p class="student-muted">Зареждаме маршрутите...</p>
            </div>
          </section>
        </div>
      </section>
    </main>

    <footer class="site-footer border-top py-3">
      <div class="container text-body-secondary small">
        Малки ГИС изследователи · Любопитството води напред
      </div>
    </footer>
  </div>
`;

const studentStatus = document.querySelector('#student-status');
const errorElement = document.querySelector('#student-error');
const workspace = document.querySelector('#student-workspace');
const form = document.querySelector('#route-form');
const stopsList = document.querySelector('#stops-list');
const routesList = document.querySelector('#routes-list');
const formMessage = document.querySelector('#form-message');
const saveDraftButton = document.querySelector('#save-draft');
const submitRouteButton = document.querySelector('#submit-route');
const cancelEditButton = document.querySelector('#cancel-edit');
const worksheetTitle = document.querySelector('#worksheet-title');
const worksheetMode = document.querySelector('#worksheet-mode');
const teacherLinkStatus = document.querySelector('#teacher-link-status');
const joinTeacherForm = document.querySelector('#join-teacher-form');
const joinTeacherButton = document.querySelector('#join-teacher-button');
const teacherLinkMessage = document.querySelector('#teacher-link-message');
const assignmentsList = document.querySelector('#assignments-list');
const studentTools = document.querySelector('#student-tools');
let session;
let editingRouteId = null;
let routes = [];
let reviewsByRoute = new Map();
let activeAssignment = null;
let canJoinTeacher = false;
let isJoiningTeacher = false;
let stopId = 0;

const setStudentStatus = (text, type = 'success') => {
  studentStatus.className = `student-status student-status-${type}`;
  studentStatus.textContent = text;
};

const showError = (text) => {
  errorElement.textContent = text;
  errorElement.hidden = false;
  setStudentStatus('Не успяхме да заредим работното пространство.', 'error');
};

const showFormMessage = (text, type = 'success') => {
  formMessage.className = `student-message student-message-${type}`;
  formMessage.textContent = text;
  formMessage.hidden = false;
};

const clearFormMessage = () => {
  formMessage.hidden = true;
  formMessage.textContent = '';
};

const createStop = (stop = {}) => {
  stopId += 1;
  const fieldId = stopId;
  const stopElement = document.createElement('div');
  stopElement.className = 'stop-entry';
  stopElement.innerHTML = `
    <div class="stop-entry-heading">
      <h3 class="h6 mb-0">Място</h3>
      <button class="stop-remove" type="button">Премахни</button>
    </div>
    <div class="row g-2">
      <div class="col-12">
        <label class="form-label" for="stop-name-${fieldId}">Наименование</label>
        <input id="stop-name-${fieldId}" class="form-control stop-name" name="stop-name" type="text" maxlength="160" required>
      </div>
      <div class="col-12">
        <label class="form-label" for="stop-settlement-${fieldId}">Населено място</label>
        <input id="stop-settlement-${fieldId}" class="form-control stop-settlement" name="stop-settlement" type="text" maxlength="160">
      </div>
      <div class="col-md-6">
        <label class="form-label" for="stop-latitude-${fieldId}">Географска ширина</label>
        <input id="stop-latitude-${fieldId}" class="form-control stop-latitude" name="stop-latitude" type="number" step="any" min="-90" max="90">
      </div>
      <div class="col-md-6">
        <label class="form-label" for="stop-longitude-${fieldId}">Географска дължина</label>
        <input id="stop-longitude-${fieldId}" class="form-control stop-longitude" name="stop-longitude" type="number" step="any" min="-180" max="180">
      </div>
      <div class="col-12">
        <label class="form-label" for="stop-note-${fieldId}">Кратка бележка</label>
        <textarea id="stop-note-${fieldId}" class="form-control stop-note" name="stop-note" rows="3" maxlength="1000"></textarea>
      </div>
    </div>
  `;
  stopElement.querySelector('.stop-name').value = stop.name || '';
  stopElement.querySelector('.stop-settlement').value = stop.settlement || '';
  stopElement.querySelector('.stop-latitude').value = stop.latitude ?? '';
  stopElement.querySelector('.stop-longitude').value = stop.longitude ?? '';
  stopElement.querySelector('.stop-note').value = stop.note || '';
  stopElement.querySelector('.stop-remove').addEventListener('click', () => stopElement.remove());
  stopsList.append(stopElement);
};

const resetForm = () => {
  editingRouteId = null;
  activeAssignment = null;
  form.reset();
  stopsList.replaceChildren();
  createStop();
  worksheetTitle.textContent = 'Създай маршрут';
  worksheetMode.textContent = 'Нова чернова';
  cancelEditButton.hidden = true;
  saveDraftButton.disabled = false;
  submitRouteButton.disabled = false;
  clearFormMessage();
};

const collectStops = () =>
  [...stopsList.querySelectorAll('.stop-entry')].map((stopElement) => {
    const latitude = stopElement.querySelector('.stop-latitude').value;
    const longitude = stopElement.querySelector('.stop-longitude').value;
    return {
      name: stopElement.querySelector('.stop-name').value.trim(),
      settlement: stopElement.querySelector('.stop-settlement').value.trim(),
      latitude: latitude === '' ? null : Number(latitude),
      longitude: longitude === '' ? null : Number(longitude),
      note: stopElement.querySelector('.stop-note').value.trim()
    };
  });

const getRouteValues = () => ({
  title: document.querySelector('#route-title').value.trim(),
  selected_stops: collectStops(),
  annotation: document.querySelector('#route-annotation').value.trim()
});

const setFormFromRoute = (route) => {
  editingRouteId = route.id;
  activeAssignment = null;
  document.querySelector('#route-title').value = route.title;
  document.querySelector('#route-annotation').value = route.annotation || '';
  stopsList.replaceChildren();
  (Array.isArray(route.selected_stops) ? route.selected_stops : []).forEach(createStop);
  if (!stopsList.children.length) createStop();
  worksheetTitle.textContent = 'Редактирай черновата';
  worksheetMode.textContent = 'Чернова';
  cancelEditButton.hidden = false;
  clearFormMessage();
  window.scrollTo({ top: document.querySelector('.student-form-card').offsetTop - 20, behavior: 'smooth' });
};

const setFormSubmitting = (isSubmitting) => {
  saveDraftButton.disabled = isSubmitting;
  submitRouteButton.disabled = isSubmitting;
  cancelEditButton.disabled = isSubmitting;
  saveDraftButton.textContent = isSubmitting ? 'Запазваме...' : 'Запази чернова';
};

const renderRoutes = () => {
  routesList.replaceChildren();
  if (!routes.length) {
    const empty = document.createElement('p');
    empty.className = 'student-muted';
    empty.textContent = 'Все още нямаш запазени маршрути.';
    routesList.append(empty);
    return;
  }

  routes.forEach((route) => {
    const card = document.createElement('article');
    card.className = 'route-item';
    const heading = document.createElement('div');
    heading.className = 'route-item-heading';
    const title = document.createElement('h3');
    title.className = 'h6 mb-0';
    title.textContent = route.title;
    const status = document.createElement('span');
    status.className = `route-status route-status-${route.status}`;
    status.textContent = { draft: 'Чернова', submitted: 'Предаден', reviewed: 'Проверен' }[route.status] || route.status;
    heading.append(title, status);
    card.append(heading);

    const updated = document.createElement('p');
    updated.className = 'route-item-date';
    updated.textContent = `Последна промяна: ${new Date(route.updated_at).toLocaleDateString('bg-BG')}`;
    card.append(updated);

    const review = reviewsByRoute.get(route.id);
    if (review) {
      const reviewPanel = document.createElement('div');
      reviewPanel.className = 'student-review-panel';
      const reviewTitle = document.createElement('strong');
      const achievementLabels = {
        beginning: 'Начално ниво',
        developing: 'В развитие',
        achieved: 'Постигнато',
        excellent: 'Отлично'
      };
      reviewTitle.textContent = `Обратна връзка от учителя · ${achievementLabels[review.achievement_level] || review.achievement_level}`;
      reviewPanel.append(reviewTitle);
      if (review.feedback) {
        const feedback = document.createElement('p');
        feedback.className = 'mb-0 mt-2';
        feedback.textContent = review.feedback;
        reviewPanel.append(feedback);
      }
      card.append(reviewPanel);
    }

    if (route.status === 'draft') {
      const editButton = document.createElement('button');
      editButton.className = 'student-secondary-action';
      editButton.type = 'button';
      editButton.textContent = 'Редактирай';
      editButton.addEventListener('click', () => setFormFromRoute(route));
      card.append(editButton);
    }
    routesList.append(card);
  });
};

const loadRoutes = async () => {
  const { data, error } = await supabase
    .from('routes')
    .select('id, title, selected_stops, annotation, status, assignment_id, created_at, updated_at')
    .eq('student_id', session.user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    showError(`Маршрутите не могат да бъдат заредени: ${error.message}`);
    return false;
  }

  routes = data || [];
  reviewsByRoute = new Map();
  if (routes.length) {
    const { data: reviewRows, error: reviewError } = await supabase
      .from('teacher_reviews')
      .select('route_id, achievement_level, feedback, created_at')
      .in('route_id', routes.map((route) => route.id));

    if (reviewError) {
      showError(`Обратната връзка не може да бъде заредена: ${reviewError.message}`);
    } else {
      reviewsByRoute = new Map((reviewRows || []).map((review) => [review.route_id, review]));
    }
  }
  renderRoutes();
  return true;
};

const showTeacherLinkMessage = (text, type = 'success') => {
  teacherLinkMessage.className = `student-message student-message-${type}`;
  teacherLinkMessage.textContent = text;
  teacherLinkMessage.hidden = false;
};

const loadTeacherLink = async () => {
  canJoinTeacher = false;
  joinTeacherForm.hidden = true;
  try {
    const { data, error } = await supabase.rpc('student_has_teacher');
    if (error || (data !== true && data !== false)) {
      throw error || new Error('Неочакван отговор при проверката на връзката с учител.');
    }

    if (data === true) {
      teacherLinkStatus.textContent = 'Вече си свързан/а с учител. Само администратор може да управлява тази връзка.';
      teacherLinkStatus.className = 'student-muted';
      joinTeacherForm.hidden = true;
      return { hasTeacher: true };
    }

    teacherLinkStatus.textContent = 'Все още нямаш свързан учител. Въведи кода, който си получил/а.';
    teacherLinkStatus.className = 'student-muted';
    canJoinTeacher = true;
    joinTeacherForm.hidden = false;
    return { hasTeacher: false };
  } catch (error) {
    joinTeacherForm.hidden = true;
    teacherLinkStatus.className = 'student-muted student-message student-message-error';
    teacherLinkStatus.textContent = `Не успяхме да проверим връзката с учител: ${error?.message || 'Неизвестна грешка'}. Формата е временно скрита; опитай отново по-късно.`;
    return { hasTeacher: null, error };
  }
};

const loadAssignments = async () => {
  const { data: recipientRows, error: recipientError } = await supabase
    .from('assignment_recipients')
    .select('assignment_id, assigned_at')
    .eq('student_id', session.user.id)
    .order('assigned_at', { ascending: false });

  if (recipientError) {
    assignmentsList.replaceChildren();
    const message = document.createElement('p');
    message.className = 'student-message student-message-error';
    message.textContent = `Заданията не могат да бъдат заредени: ${recipientError.message}`;
    assignmentsList.append(message);
    return;
  }

  const assignmentIds = [...new Set((recipientRows || []).map((row) => row.assignment_id))];
  if (!assignmentIds.length) {
    assignmentsList.innerHTML = '<p class="student-muted">Все още нямаш възложени задания.</p>';
    return;
  }

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from('assignments')
    .select('id, title, instructions, worksheet_template, status, published_at')
    .in('id', assignmentIds)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (assignmentError) {
    assignmentsList.replaceChildren();
    const message = document.createElement('p');
    message.className = 'student-message student-message-error';
    message.textContent = `Заданията не могат да бъдат заредени: ${assignmentError.message}`;
    assignmentsList.append(message);
    return;
  }

  assignmentsList.replaceChildren();
  if (!assignmentRows?.length) {
    assignmentsList.innerHTML = '<p class="student-muted">Нямаш активни публикувани задания.</p>';
    return;
  }

  assignmentRows.forEach((assignment) => {
    const card = document.createElement('article');
    card.className = 'assignment-item';
    const title = document.createElement('h3');
    title.className = 'h6';
    title.textContent = assignment.title;
    card.append(title);
    if (assignment.instructions) {
      const instructions = document.createElement('p');
      instructions.textContent = assignment.instructions;
      card.append(instructions);
    }

    const existingRoute = routes.find((route) => route.assignment_id === assignment.id);
    if (existingRoute?.status === 'draft') {
      const continueButton = document.createElement('button');
      continueButton.className = 'student-secondary-action';
      continueButton.type = 'button';
      continueButton.textContent = 'Продължи черновата';
      continueButton.addEventListener('click', () => setFormFromRoute(existingRoute));
      card.append(continueButton);
    } else if (existingRoute) {
      const state = document.createElement('p');
      state.className = 'student-muted mb-0';
      state.textContent = 'Вече има маршрут по това задание. Повторно предаване не е възможно.';
      card.append(state);
    } else {
      const startButton = document.createElement('button');
      startButton.className = 'student-primary-action';
      startButton.type = 'button';
      startButton.textContent = 'Започни маршрут';
      startButton.addEventListener('click', () => {
        resetForm();
        activeAssignment = assignment;
        document.querySelector('#route-title').value = assignment.title;
        worksheetTitle.textContent = 'Маршрут по задание';
        worksheetMode.textContent = 'Ново задание';
        window.scrollTo({ top: document.querySelector('.student-form-card').offsetTop - 20, behavior: 'smooth' });
      });
      card.append(startButton);
    }
    assignmentsList.append(card);
  });
};

const insertDraft = async (values) => {
  const { data, error } = await supabase
    .from('routes')
    .insert({ ...values, student_id: session.user.id, status: 'draft' })
    .select('id, title, selected_stops, annotation, status, created_at, updated_at')
    .single();
  return { data, error };
};

const updateRoute = async (routeId, values, status = 'draft') => {
  const { data, error } = await supabase
    .from('routes')
    .update({ ...values, status })
    .eq('id', routeId)
    .eq('student_id', session.user.id)
    .select('id, title, selected_stops, annotation, status, created_at, updated_at')
    .single();
  return { data, error };
};

const saveRoute = async (requestedStatus) => {
  if (!form.reportValidity()) {
    showFormMessage('Попълни име на маршрута и наименование за всяко място.', 'error');
    return;
  }

  setFormSubmitting(true);
  clearFormMessage();
  const values = getRouteValues();
  let result;

  if (editingRouteId) {
    result = await updateRoute(editingRouteId, values, requestedStatus);
  } else if (activeAssignment) {
    result = await supabase.rpc('create_assignment_route', {
      p_assignment_id: activeAssignment.id,
      p_title: values.title,
      p_selected_stops: values.selected_stops,
      p_annotation: values.annotation
    });
    if (!result.error) {
      editingRouteId = result.data.id;
      if (requestedStatus === 'submitted') {
        result = await updateRoute(result.data.id, values, 'submitted');
      }
    }
  } else {
    result = await insertDraft(values);
    if (!result.error && requestedStatus === 'submitted') {
      editingRouteId = result.data.id;
    }
    if (!result.error && requestedStatus === 'submitted') {
      result = await updateRoute(result.data.id, values, 'submitted');
    }
  }

  setFormSubmitting(false);

  if (result.error) {
    if (editingRouteId && requestedStatus === 'submitted') {
      await loadRoutes();
      showFormMessage(`Маршрутът е запазен като чернова, но не беше предаден: ${result.error.message}`, 'error');
      return;
    }
    showFormMessage(`Работата не беше запазена: ${result.error.message}`, 'error');
    return;
  }

  await loadRoutes();
  if (requestedStatus === 'submitted') {
    resetForm();
    showFormMessage('Работата е предадена за проверка.', 'success');
  } else {
    editingRouteId = result.data.id;
    setFormFromRoute(result.data);
    showFormMessage('Черновата е запазена.', 'success');
  }
};

const initializeStudentPage = async () => {
  const user = await requireRole(supabase, ['student'], (message) => showError(`Профилът не може да бъде зареден: ${message}`));
  if (!user) {
    return;
  }

  session = user.session;
  document.querySelector('#role-navigation').innerHTML = renderRoleNavigation('student', 'dashboard');
  setStudentStatus('Готово за работа. Роля: Ученик.');
  workspace.hidden = false;
  studentTools.hidden = false;
  resetForm();
  await Promise.all([loadTeacherLink(), loadRoutes()]);
  await loadAssignments();
};

document.querySelector('#add-stop').addEventListener('click', () => createStop());
form.addEventListener('submit', (event) => {
  event.preventDefault();
  saveRoute('draft');
});
submitRouteButton.addEventListener('click', () => saveRoute('submitted'));
cancelEditButton.addEventListener('click', resetForm);
joinTeacherForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (joinTeacherForm.hidden || !canJoinTeacher || isJoiningTeacher) return;

  isJoiningTeacher = true;
  canJoinTeacher = false;
  joinTeacherButton.disabled = true;
  const codeInput = document.querySelector('#teacher-join-code');
  codeInput.disabled = true;
  const joinCode = codeInput.value.trim();
  codeInput.value = '';

  try {
    let result;
    try {
      result = await supabase.rpc('join_teacher', { p_join_code: joinCode });
    } catch (error) {
      result = { error };
    }

    if (result.error || result.data !== true) {
      const status = await loadTeacherLink();
      if (status.hasTeacher === true) {
        teacherLinkStatus.textContent = 'Вече си свързан/а с учител. Присъединяването не се повтаря.';
        teacherLinkStatus.className = 'student-status student-status-success';
      } else if (status.hasTeacher === false) {
        if (result.error?.code === '42501') {
          showTeacherLinkMessage(`Присъединяването беше отказано. Кодът може да е невалиден или изтекъл, или профилът да не отговаря на условията. Детайл: ${result.error.message || 'SQLSTATE 42501'}`, 'error');
        } else if (result.error) {
          showTeacherLinkMessage(`RPC грешка при присъединяването: ${result.error.message || String(result.error)}${result.error.code ? ` (${result.error.code})` : ''}`, 'error');
        } else {
          showTeacherLinkMessage('Кодът е невалиден или изтекъл; RPC не потвърди присъединяването.', 'error');
        }
      } else {
        const rpcDetail = result.error
          ? `RPC грешка: ${result.error.message || String(result.error)}${result.error.code ? ` (${result.error.code})` : ''}. `
          : 'RPC не върна true. ';
        teacherLinkStatus.textContent = `${teacherLinkStatus.textContent} ${rpcDetail}Не успяхме да потвърдим връзката.`;
      }
      return;
    }

    const status = await loadTeacherLink();
    if (status.hasTeacher === true) {
      teacherLinkStatus.textContent = 'Успешно се присъедини към учител.';
      teacherLinkStatus.className = 'student-status student-status-success';
    } else if (status.hasTeacher === false) {
      showTeacherLinkMessage('Кодът беше приет, но връзката не се потвърди. Провери отново след малко.', 'error');
    }
  } finally {
    isJoiningTeacher = false;
    joinTeacherButton.disabled = false;
    codeInput.disabled = false;
  }
});

const iframe = document.querySelector('#student-map');
const fallback = document.querySelector('#student-map-fallback');
const retryButton = document.querySelector('#student-map-retry');
let loadTimeout;
const startMapLoadCheck = () => {
  window.clearTimeout(loadTimeout);
  fallback.hidden = true;
  loadTimeout = window.setTimeout(() => {
    fallback.hidden = false;
  }, 10000);
};
iframe.addEventListener('load', () => window.clearTimeout(loadTimeout));
iframe.addEventListener('error', () => {
  fallback.hidden = false;
});
retryButton.addEventListener('click', () => {
  iframe.src = `${arcgisUrl}&retry=${Date.now()}`;
  startMapLoadCheck();
});
startMapLoadCheck();

supabase.auth.onAuthStateChange((event, activeSession) => {
  if (event === 'SIGNED_OUT' || !activeSession) {
    window.location.replace('auth.html');
  }
});

initializeStudentPage();
