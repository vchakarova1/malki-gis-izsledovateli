import { ROLE_HOME } from './role-access.js';

export const renderRoleNavigation = (role, currentPage) => {
  const roleLabel = {
    student: 'Ученик',
    teacher: 'Учител',
    admin: 'Администратор'
  }[role];
  const roleHome = ROLE_HOME[role];
  const links = [
    ['index.html', 'Начало', 'home'],
    ['map.html', 'Карта', 'map'],
    ['missions.html', 'Лаборатория', 'missions'],
    [roleHome, `Пространство: ${roleLabel}`, 'dashboard'],
    ['profile.html', 'Профил', 'profile']
  ];

  return `
    <nav class="container navbar py-3 role-navigation" aria-label="Основна навигация">
      <a class="navbar-brand brand-mark fw-bold" href="index.html" aria-label="Към началната страница">
        <span class="brand-icon" aria-hidden="true">🧭</span>
        <span>Малки ГИС изследователи</span>
      </a>
      <div class="role-navigation-links">
        ${links.map(([href, label, page]) => `
          <a class="header-badge${currentPage === page ? ' is-current' : ''}" href="${href}"${currentPage === page ? ' aria-current="page"' : ''}>${label}</a>
        `).join('')}
      </div>
    </nav>
  `;
};
