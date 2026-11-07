import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import './profile-page.css';
import { supabase } from './supabase-client.js';
import { getSignedInUser, getRoleHome } from './role-access.js';
import { renderRoleNavigation } from './role-navigation.js';

const app = document.querySelector('#profile-app');

app.innerHTML = `
  <div class="profile-page-shell min-vh-100 d-flex flex-column">
    <header class="site-header">
      <div id="role-navigation"></div>
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
          <a id="profile-dashboard-link" class="profile-action profile-action-secondary" href="student.html">Моето работно пространство</a>
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

const loadProfile = async (session, profile) => {
  if (!profile) {
    showError('Профилът още не е наличен. Опитай отново след малко или се свържи с администратор.');
    return;
  }

  document.querySelector('#profile-email').textContent = session.user.email || 'Имейлът не е наличен';
  document.querySelector('#profile-role').textContent = profile.role || 'Неопределена';
  const dashboardLink = document.querySelector('#profile-dashboard-link');
  dashboardLink.href = getRoleHome(profile.role);
  dashboardLink.textContent = {
    student: 'Моят работен лист',
    teacher: 'Учителско пространство',
    admin: 'Администраторско пространство'
  }[profile.role] || 'Моето пространство';
  document.querySelector('#role-navigation').innerHTML = renderRoleNavigation(profile.role, 'profile');
  document.querySelector('#profile-created-at').textContent = new Date(profile.created_at).toLocaleDateString(
    'bg-BG',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
  statusElement.className = 'profile-status profile-status-success';
  statusElement.textContent = 'Добре дошъл в своето изследователско пространство!';
  detailsElement.hidden = false;
};

const initializeProfile = async () => {
  const { session, profile, error } = await getSignedInUser(supabase);

  if (error) {
    showError(`Сесията не може да бъде проверена: ${error.message}`);
    return;
  }

  if (!session) {
    redirectToAuth();
    return;
  }

  if (!profile) {
    showError('Профилът още не е наличен. Опитай отново след малко.');
    return;
  }

  await loadProfile(session, profile);
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
