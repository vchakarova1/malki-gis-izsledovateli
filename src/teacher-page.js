import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import './profile-page.css';
import { supabase } from './supabase-client.js';
import { requireRole } from './role-access.js';
import { renderRoleNavigation } from './role-navigation.js';

const app = document.querySelector('#teacher-app');
app.innerHTML = `
  <div class="profile-page-shell min-vh-100 d-flex flex-column">
    <header class="site-header"><div id="role-navigation"></div></header>
    <main class="container flex-grow-1 py-4 py-md-5">
      <section class="profile-card mx-auto" aria-labelledby="teacher-title">
        <div class="profile-heading">
          <p class="eyebrow mb-2">Учителско пространство</p>
          <h1 id="teacher-title" class="h2 mb-2">Добре дошли</h1>
          <p id="teacher-status" class="profile-status mb-0" role="status" aria-live="polite">Проверяваме достъпа...</p>
        </div>
        <div id="teacher-content" hidden>
          <p class="mb-0">Тук ще управлявате индивидуалните задания и ученическите маршрути.</p>
        </div>
      </section>
    </main>
  </div>
`;

const status = document.querySelector('#teacher-status');
const teacherContent = document.querySelector('#teacher-content');
const teacher = await requireRole(supabase, ['teacher'], (message) => {
  status.className = 'profile-status profile-status-error';
  status.textContent = `Достъпът не може да бъде проверен: ${message}`;
});

if (teacher) {
  document.querySelector('#role-navigation').innerHTML = renderRoleNavigation('teacher', 'dashboard');
  status.textContent = 'Достъпът е потвърден за учител.';
  teacherContent.hidden = false;
}
