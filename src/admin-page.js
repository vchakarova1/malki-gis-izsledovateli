import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import './profile-page.css';
import './admin-page.css';
import { supabase } from './supabase-client.js';
import { requireRole } from './role-access.js';
import { renderRoleNavigation } from './role-navigation.js';

const sections = [
  { value: 'missions', label: 'Актуални мисии' },
  { value: 'challenges', label: 'Изследователски предизвикателства' },
  { value: 'projects', label: 'Проекти и творчески идеи' },
  { value: 'discoveries', label: 'Моите открития' }
];

const app = document.querySelector('#admin-app');

app.innerHTML = `
  <div class="profile-page-shell admin-page-shell min-vh-100 d-flex flex-column">
    <header class="site-header"><div id="role-navigation"></div></header>
    <main class="container flex-grow-1 py-4 py-md-5">
      <section class="profile-card admin-workspace mx-auto" aria-labelledby="admin-title">
        <div class="profile-heading">
          <p class="eyebrow mb-2">Администраторско пространство</p>
          <h1 id="admin-title" class="h2 mb-2">Публични публикации</h1>
          <p id="admin-status" class="profile-status mb-0" role="status" aria-live="polite">Проверяваме достъпа...</p>
        </div>
        <div id="admin-content" class="admin-content" hidden>
          <section aria-labelledby="proposals-title">
            <div class="admin-section-heading">
              <div>
                <p class="eyebrow mb-1">За преглед</p>
                <h2 id="proposals-title" class="h3 mb-0">Предложения от учители</h2>
              </div>
              <button id="admin-refresh" class="btn admin-button-secondary" type="button">Обнови</button>
            </div>
            <div id="admin-publication-list" class="admin-publication-list" aria-live="polite">
              <p class="admin-muted">Зареждаме предложенията...</p>
            </div>
          </section>
        </div>
      </section>
    </main>
  </div>
`;

const status = document.querySelector('#admin-status');
const adminContent = document.querySelector('#admin-content');
const publicationList = document.querySelector('#admin-publication-list');
const refreshButton = document.querySelector('#admin-refresh');
const busyPublicationIds = new Set();
let publications = [];

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);

const formatDate = (value) => {
  if (!value) return 'Няма дата';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Невалидна дата' : new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const setStatus = (message, kind = 'default') => {
  status.className = `profile-status mb-0${kind === 'error' ? ' profile-status-error' : kind === 'success' ? ' profile-status-success' : ''}`;
  status.textContent = message;
};

const renderPublications = () => {
  if (!publications.length) {
    publicationList.innerHTML = '<div class="admin-empty-state">Няма предложения за преглед в момента.</div>';
    return;
  }

  publicationList.innerHTML = publications.map((publication) => {
    const id = escapeHtml(publication.id);
    const stops = Array.isArray(publication.public_stops) ? publication.public_stops : [];
    const selectedSection = sections.some(({ value }) => value === publication.section_key) ? publication.section_key : '';
    const sectionOptions = sections.map(({ value, label }) => `<option value="${value}" ${selectedSection === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');

    return `
      <article class="admin-publication-card" data-publication-id="${id}">
        <div class="admin-publication-heading">
          <div>
            <span class="admin-status-badge">Предложена</span>
            <h3 class="h4 mt-2 mb-1">${escapeHtml(publication.public_title || 'Публикация без заглавие')}</h3>
            <p class="admin-muted mb-0">Предложена ${escapeHtml(formatDate(publication.created_at))}</p>
          </div>
          <div class="admin-ids">
            <span>Автор ID</span><code>${escapeHtml(publication.proposed_by)}</code>
            <span>Маршрут ID</span><code>${escapeHtml(publication.route_id)}</code>
          </div>
        </div>

        <details class="admin-source-preview">
          <summary>Прегледай подаденото съдържание</summary>
          <p class="admin-preserve-lines"><strong>Публично описание:</strong><br>${escapeHtml(publication.public_description || 'Няма описание.')}</p>
          <p class="admin-preserve-lines"><strong>Анотация:</strong><br>${escapeHtml(publication.public_annotation || 'Няма анотация.')}</p>
          <h4 class="h6">Публични спирки (${stops.length})</h4>
          ${stops.length ? `<ol class="admin-stop-list">${stops.map((stop) => `<li><strong>${escapeHtml(stop?.name || 'Без име')}</strong>${stop?.settlement ? ` · ${escapeHtml(stop.settlement)}` : ''}${stop?.latitude != null && stop?.longitude != null ? `<span class="admin-stop-coordinates">${escapeHtml(stop.latitude)}, ${escapeHtml(stop.longitude)}</span>` : ''}${stop?.note ? `<p class="mb-0">${escapeHtml(stop.note)}</p>` : ''}</li>`).join('')}</ol>` : '<p class="admin-muted">Няма записани спирки.</p>'}
          <p class="admin-muted small mb-0">Преглеждат се само данните от публичното предложение. Оригиналният маршрут не се зарежда или редактира.</p>
        </details>

        <form class="admin-edit-form" data-edit-form="${id}">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label" for="admin-title-${id}">Публично заглавие</label>
              <input class="form-control" id="admin-title-${id}" name="publicTitle" type="text" maxlength="180" value="${escapeHtml(publication.public_title)}" required>
            </div>
            <div class="col-12">
              <label class="form-label" for="admin-description-${id}">Публично описание</label>
              <textarea class="form-control" id="admin-description-${id}" name="publicDescription" rows="3" maxlength="10000" required>${escapeHtml(publication.public_description)}</textarea>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="admin-section-${id}">Публична секция</label>
              <select class="form-select" id="admin-section-${id}" name="sectionKey" required>
                <option value="" ${selectedSection ? '' : 'selected'} disabled>Изберете секция</option>
                ${sectionOptions}
              </select>
            </div>
            <div class="col-12">
              <label class="form-label" for="admin-stops-${id}">Публични спирки (JSON масив)</label>
              <textarea class="form-control admin-json-input" id="admin-stops-${id}" name="publicStops" rows="8" spellcheck="false" required>${escapeHtml(JSON.stringify(stops, null, 2))}</textarea>
              <p class="admin-muted small mt-1 mb-0">Редактира се копието в публикацията, не оригиналният ученически маршрут.</p>
            </div>
            <div class="col-12">
              <label class="form-label" for="admin-annotation-${id}">Публична анотация</label>
              <textarea class="form-control" id="admin-annotation-${id}" name="publicAnnotation" rows="3" maxlength="10000">${escapeHtml(publication.public_annotation)}</textarea>
            </div>
          </div>
          <p class="admin-operation-status" data-operation-status role="status" aria-live="polite"></p>
          <div class="admin-card-actions">
            <button class="btn admin-button-primary" type="submit">Запази редакцията</button>
            <button class="btn admin-button-approve" type="button" data-action="approve">Одобри и публикувай</button>
          </div>
        </form>

        <form class="admin-reject-form" data-reject-form="${id}">
          <label class="form-label" for="admin-note-${id}">Бележка при отхвърляне (по избор)</label>
          <textarea class="form-control" id="admin-note-${id}" name="adminNote" rows="2" maxlength="10000" placeholder="Кратко обяснение към предложението"></textarea>
          <button class="btn admin-button-reject mt-2" type="submit">Отхвърли предложението</button>
        </form>
      </article>
    `;
  }).join('');
};

const loadPublications = async ({ announce = false } = {}) => {
  refreshButton.disabled = true;
  publicationList.innerHTML = '<p class="admin-muted">Зареждаме предложенията...</p>';
  try {
    const { data, error } = await supabase
      .from('publications')
      .select('id, route_id, proposed_by, status, public_title, public_description, public_stops, public_annotation, section_key, admin_note, created_at')
      .eq('status', 'proposed')
      .order('created_at', { ascending: true });

    if (error) throw error;

    publications = Array.isArray(data) ? data.filter(({ status: publicationStatus }) => publicationStatus === 'proposed') : [];
    renderPublications();
    if (announce) setStatus('Списъкът с предложения е обновен.', 'success');
    else setStatus(`Достъпът е потвърден за администратор. Заредени предложения: ${publications.length}.`, 'success');
  } catch (error) {
    publications = [];
    publicationList.innerHTML = '<div class="admin-notice-error">Предложенията не се заредиха. Проверете достъпа и опитайте отново.</div>';
    setStatus(`Грешка при зареждането: ${error?.message || 'Връзката не отговори.'}`, 'error');
  } finally {
    refreshButton.disabled = false;
  }
};

const setCardBusy = (card, isBusy, message = '', kind = '') => {
  card.querySelectorAll('button, input, textarea, select').forEach((control) => {
    control.disabled = isBusy;
  });
  const operationStatus = card.querySelector('[data-operation-status]');
  if (operationStatus) {
    operationStatus.className = `admin-operation-status${kind ? ` is-${kind}` : ''}`;
    operationStatus.textContent = message;
  }
};

const getPublication = (publicationId) => publications.find(({ id }) => id === publicationId);

const withPublicationLock = async (card, operation) => {
  const publicationId = card.dataset.publicationId;
  if (!publicationId || busyPublicationIds.has(publicationId)) return;
  busyPublicationIds.add(publicationId);
  setCardBusy(card, true, 'Обработваме заявката...');
  try {
    await operation(publicationId);
  } catch (error) {
    setCardBusy(card, false, `Операцията не завърши: ${error?.message || 'Връзката не отговори.'}`, 'error');
  } finally {
    busyPublicationIds.delete(publicationId);
  }
};

const hasUnsavedEdits = (form, publication) => {
  let currentStops;
  try {
    currentStops = JSON.parse(form.elements.publicStops.value);
  } catch {
    return true;
  }

  return form.elements.publicTitle.value.trim() !== publication.public_title
    || form.elements.publicDescription.value.trim() !== publication.public_description
    || form.elements.sectionKey.value !== (publication.section_key || '')
    || form.elements.publicAnnotation.value !== (publication.public_annotation || '')
    || !Array.isArray(currentStops)
    || JSON.stringify(currentStops) !== JSON.stringify(publication.public_stops || []);
};

const admin = await requireRole(supabase, ['admin'], (message) => {
  setStatus(`Достъпът не може да бъде проверен: ${message}`, 'error');
});

if (admin) {
  document.querySelector('#role-navigation').innerHTML = renderRoleNavigation('admin', 'dashboard');
  adminContent.hidden = false;

  refreshButton.addEventListener('click', () => loadPublications({ announce: true }));

  publicationList.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-edit-form]');
    if (!form) return;
    event.preventDefault();
    if (!form.reportValidity()) return;

    const card = form.closest('[data-publication-id]');
    const publicationId = form.dataset.editForm;
    const publication = getPublication(publicationId);
    if (!publication) return;

    await withPublicationLock(card, async () => {
      let publicStops;
      try {
        publicStops = JSON.parse(form.elements.publicStops.value);
      } catch {
        setCardBusy(card, false, 'Спирките трябва да бъдат валиден JSON масив.', 'error');
        return;
      }
      if (!Array.isArray(publicStops)) {
        setCardBusy(card, false, 'Спирките трябва да бъдат JSON масив.', 'error');
        return;
      }

      const { error } = await supabase.rpc('edit_publication', {
        p_publication_id: publicationId,
        p_public_title: form.elements.publicTitle.value.trim(),
        p_public_description: form.elements.publicDescription.value.trim(),
        p_public_stops: publicStops,
        p_section_key: form.elements.sectionKey.value,
        p_public_annotation: form.elements.publicAnnotation.value.trim()
      });

      if (error) {
        setCardBusy(card, false, `Редакцията не се запази: ${error.message}`, 'error');
        return;
      }

      setStatus('Публичната версия е запазена. Оригиналният маршрут не е променен.', 'success');
      await loadPublications();
    });
  });

  publicationList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action="approve"]');
    if (!button) return;
    const card = button.closest('[data-publication-id]');
    const publicationId = card?.dataset.publicationId;
    const publication = getPublication(publicationId);
    if (!publicationId || !publication) return;
    const editForm = card.querySelector('[data-edit-form]');
    if (hasUnsavedEdits(editForm, publication)) {
      setCardBusy(card, false, 'Запазете редакциите и избраната секция преди одобрение.', 'error');
      return;
    }
    const sectionSelect = card.querySelector('[name="sectionKey"]');
    if (!sectionSelect.value) {
      setCardBusy(card, false, 'Преди одобрение изберете секция и запазете редакцията.', 'error');
      sectionSelect.focus();
      return;
    }
    if (!window.confirm('Одобряване ще публикува тази ученическа работа в публичната лаборатория. Продължавате ли?')) return;

    await withPublicationLock(card, async () => {
      const { error } = await supabase.rpc('approve_publication', { p_publication_id: publicationId });
      if (error) {
        setCardBusy(card, false, `Публикацията не беше одобрена: ${error.message}`, 'error');
        return;
      }
      setStatus('Публикацията е одобрена и ще се показва в избраната публична секция.', 'success');
      await loadPublications();
    });
  });

  publicationList.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-reject-form]');
    if (!form) return;
    event.preventDefault();
    const card = form.closest('[data-publication-id]');
    const publicationId = form.dataset.rejectForm;
    if (!publicationId || !getPublication(publicationId)) return;
    if (!window.confirm('Отхвърлянето приключва прегледа на това предложение. Продължавате ли?')) return;

    await withPublicationLock(card, async () => {
      const { error } = await supabase.rpc('reject_publication', {
        p_publication_id: publicationId,
        p_admin_note: form.elements.adminNote.value.trim()
      });
      if (error) {
        setCardBusy(card, false, `Предложението не беше отхвърлено: ${error.message}`, 'error');
        return;
      }
      setStatus('Предложението е отхвърлено.', 'success');
      await loadPublications();
    });
  });

  await loadPublications();
}
