import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import './profile-page.css';
import { supabase } from './supabase-client.js';
import { requireRole } from './role-access.js';
import { renderRoleNavigation } from './role-navigation.js';

const app = document.querySelector('#admin-app');
app.innerHTML = `
  <div class="profile-page-shell min-vh-100 d-flex flex-column">
    <header class="site-header"><div id="role-navigation"></div></header>
    <main class="container flex-grow-1 py-4 py-md-5">
      <section class="profile-card mx-auto" aria-labelledby="admin-title">
        <div class="profile-heading">
          <p class="eyebrow mb-2">Администраторско пространство</p>
          <h1 id="admin-title" class="h2 mb-2">Добре дошли</h1>
          <p id="admin-status" class="profile-status mb-0" role="status" aria-live="polite">Проверяваме достъпа...</p>
        </div>
        <div id="admin-content" hidden>
          <p class="mb-0">Тук ще управлявате кодовете за свързване и предложените публикации.</p>
        </div>
      </section>
    </main>
  </div>
`;

const status = document.querySelector('#admin-status');
const adminContent = document.querySelector('#admin-content');
const admin = await requireRole(supabase, ['admin'], (message) => {
  status.className = 'profile-status profile-status-error';
  status.textContent = `Достъпът не може да бъде проверен: ${message}`;
});

if (admin) {
  document.querySelector('#role-navigation').innerHTML = renderRoleNavigation('admin', 'dashboard');
  status.textContent = 'Достъпът е потвърден за администратор.';
  adminContent.hidden = false;
}
