import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import './profile-page.css';
import { supabase } from './supabase-client.js';

const app = document.querySelector('#profile-app');

app.innerHTML = `
  <div class="profile-page-shell min-vh-100 d-flex flex-column">
    <header class="site-header">
      <nav class="container navbar py-3" aria-label="Основна навигация">
        <a class="navbar-brand brand-mark fw-bold" href="index.html" aria-label="Към началната страница">
          <span class="brand-icon" aria-hidden="true">🧭</span>
          <span>Малки ГИС изследователи</span>
        </a>
        <a class="header-badge" href="missions.html">Към лабораторията</a>
      </nav>
    </header>

    <main class="container flex-grow-1 py-4 py-md-5">
      <section class="profile-card mx-auto" aria-labelledby="profile-title">
        <div class="profile-heading">
          <p class="eyebrow mb-2">Твоето изследователско пространство</p>
          <h1 id="profile-title" class="h2 mb-2">Моят профил</h1>
          <p id="profile-status" class="profile-status mb-0" role="status" aria-live="polite">
            Зареждаме профила...
          </p>
        </div>

        <div id="profile-details" class="profile-details" hidden>
          <dl class="profile-data mb-0">
            <div>
              <dt>Имейл</dt>
              <dd id="profile-email"></dd>
            </div>
            <div>
              <dt>Роля</dt>
              <dd id="profile-role"></dd>
            </div>
            <div>
              <dt>Профил от</dt>
              <dd id="profile-created-at"></dd>
            </div>
          </dl>
          <a class="profile-action profile-action-secondary" href="student.html">Моят работен лист</a>
          <button id="sign-out" class="profile-action" type="button">Изход</button>
        </div>

        <a id="profile-auth-link" class="profile-auth-link" href="auth.html" hidden>
          Към входа и регистрацията
        </a>
      </section>
    </main>
  </div>
`;

const statusElement = document.querySelector('#profile-status');
const detailsElement = document.querySelector('#profile-details');
const authLink = document.querySelector('#profile-auth-link');
const signOutButton = document.querySelector('#sign-out');

const showError = (text) => {
  statusElement.className = 'profile-status profile-status-error';
  statusElement.textContent = text;
  detailsElement.hidden = true;
  authLink.hidden = false;
};

const redirectToAuth = () => {
  window.location.replace('auth.html');
};

const loadProfile = async (session) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, created_at, role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    showError(`Профилът не може да бъде зареден: ${error.message}`);
    return;
  }

  if (!profile) {
    showError('Профилът още не е наличен. Опитай отново след малко или се свържи с администратор.');
    return;
  }

  document.querySelector('#profile-email').textContent = session.user.email || 'Имейлът не е наличен';
  document.querySelector('#profile-role').textContent = profile.role || 'Неопределена';
  document.querySelector('#profile-created-at').textContent = new Date(profile.created_at).toLocaleDateString(
    'bg-BG',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
  statusElement.className = 'profile-status profile-status-success';
  statusElement.textContent = 'Добре дошъл в своето изследователско пространство!';
  detailsElement.hidden = false;
};

const initializeProfile = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    showError(`Сесията не може да бъде проверена: ${error.message}`);
    return;
  }

  if (!data.session) {
    redirectToAuth();
    return;
  }

  await loadProfile(data.session);
};

signOutButton.addEventListener('click', async () => {
  signOutButton.disabled = true;
  signOutButton.textContent = 'Излизане...';

  const { error } = await supabase.auth.signOut();

  if (error) {
    signOutButton.disabled = false;
    signOutButton.textContent = 'Изход';
    showError(`Изходът не беше успешен: ${error.message}`);
    return;
  }

  redirectToAuth();
});

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || !session) {
    redirectToAuth();
  }
});

initializeProfile();
