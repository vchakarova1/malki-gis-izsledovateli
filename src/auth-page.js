import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import './auth-page.css';
import { supabase } from './supabase-client.js';

const app = document.querySelector('#auth-app');

app.innerHTML = `
  <div class="auth-page-shell min-vh-100 d-flex flex-column">
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
      <section class="auth-card mx-auto" aria-labelledby="auth-title">
        <div class="auth-heading">
          <p class="eyebrow mb-2">Твоята изследователска общност</p>
          <h1 id="auth-title" class="h2 mb-2">Вход и регистрация</h1>
          <p id="auth-intro" class="mb-0">
            Влез, за да продължиш своето образователно пътешествие.
          </p>
        </div>

        <div class="auth-tabs" role="tablist" aria-label="Действие за акаунта">
          <button
            id="login-tab"
            class="auth-tab is-active"
            type="button"
            role="tab"
            aria-selected="true"
            aria-controls="login-panel"
          >
            Вход
          </button>
          <button
            id="register-tab"
            class="auth-tab"
            type="button"
            role="tab"
            aria-selected="false"
            aria-controls="register-panel"
          >
            Регистрация
          </button>
        </div>

        <div id="auth-message" class="auth-message" role="status" aria-live="polite" hidden></div>

        <form id="login-panel" class="auth-form" role="tabpanel" aria-labelledby="login-tab">
          <div class="mb-3">
            <label class="form-label" for="login-email">Имейл</label>
            <input id="login-email" class="form-control" name="email" type="email" autocomplete="email" required />
          </div>
          <div class="mb-3">
            <label class="form-label" for="login-password">Парола</label>
            <input
              id="login-password"
              class="form-control"
              name="password"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>
          <button class="auth-submit" type="submit">Вход</button>
        </form>

        <form id="register-panel" class="auth-form" role="tabpanel" aria-labelledby="register-tab" hidden>
          <div class="mb-3">
            <label class="form-label" for="register-email">Имейл</label>
            <input id="register-email" class="form-control" name="email" type="email" autocomplete="email" required />
          </div>
          <div class="mb-3">
            <label class="form-label" for="register-password">Парола</label>
            <input
              id="register-password"
              class="form-control"
              name="password"
              type="password"
              autocomplete="new-password"
              minlength="6"
              required
            />
            <div class="form-text">Паролата трябва да съдържа поне 6 символа.</div>
          </div>
          <button class="auth-submit" type="submit">Създай акаунт</button>
        </form>
      </section>
    </main>
  </div>
`;

const loginTab = document.querySelector('#login-tab');
const registerTab = document.querySelector('#register-tab');
const loginPanel = document.querySelector('#login-panel');
const registerPanel = document.querySelector('#register-panel');
const message = document.querySelector('#auth-message');

const showMessage = (text, type = 'info') => {
  message.className = `auth-message auth-message-${type}`;
  message.textContent = text;
  message.hidden = false;
};

const setMode = (mode) => {
  const isLogin = mode === 'login';
  loginTab.classList.toggle('is-active', isLogin);
  registerTab.classList.toggle('is-active', !isLogin);
  loginTab.setAttribute('aria-selected', String(isLogin));
  registerTab.setAttribute('aria-selected', String(!isLogin));
  loginPanel.hidden = !isLogin;
  registerPanel.hidden = isLogin;
  document.querySelector('#auth-title').textContent = isLogin ? 'Вход в профила' : 'Създай своя акаунт';
  document.querySelector('#auth-intro').textContent = isLogin
    ? 'Влез, за да продължиш своето образователно пътешествие.'
    : 'Регистрирай се, за да започнеш своето образователно пътешествие.';
  message.hidden = true;
};

const setSubmitting = (form, isSubmitting) => {
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting
    ? 'Моля, изчакай...'
    : form === loginPanel
      ? 'Вход'
      : 'Създай акаунт';
};

loginTab.addEventListener('click', () => setMode('login'));
registerTab.addEventListener('click', () => setMode('register'));

registerPanel.addEventListener('submit', async (event) => {
  event.preventDefault();
  setSubmitting(registerPanel, true);

  const formData = new FormData(registerPanel);
  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email'),
    password: formData.get('password')
  });

  setSubmitting(registerPanel, false);

  if (error) {
    showMessage(`Регистрацията не беше завършена: ${error.message}`, 'error');
    return;
  }

  if (data.session) {
    window.location.replace('profile.html');
    return;
  }

  showMessage('Регистрацията е успешна. Провери имейла си, за да потвърдиш акаунта.', 'success');
  registerPanel.reset();
});

loginPanel.addEventListener('submit', async (event) => {
  event.preventDefault();
  setSubmitting(loginPanel, true);

  const formData = new FormData(loginPanel);
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email'),
    password: formData.get('password')
  });

  setSubmitting(loginPanel, false);

  if (error) {
    showMessage(`Входът не беше успешен: ${error.message}`, 'error');
    return;
  }

  window.location.replace('profile.html');
});
