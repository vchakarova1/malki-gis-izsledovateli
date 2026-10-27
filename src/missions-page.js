import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import './missions-page.css';
import discoverTogetherImage from './images/discover-together.png';

const app = document.querySelector('#missions-app');

app.innerHTML = `
  <div class="missions-page-shell min-vh-100 d-flex flex-column">
    <header class="site-header">
      <nav class="container navbar py-3" aria-label="Основна навигация">
        <a class="navbar-brand brand-mark fw-bold" href="index.html" aria-label="Към началната страница">
          <span class="brand-icon" aria-hidden="true">🧭</span>
          <span>Малки ГИС изследователи</span>
        </a>
        <a class="header-badge missions-map-link" href="map.html">Към картата</a>
      </nav>
    </header>

    <main class="container flex-grow-1 py-4 py-md-5">
      <section class="missions-hero mb-5" aria-labelledby="missions-page-title">
        <div class="missions-hero-copy">
          <p class="eyebrow mb-2">Място за любопитство и идеи</p>
          <h1 id="missions-page-title">Лаборатория на откритията</h1>
          <p class="missions-hero-subtitle">Време е за открития!</p>
          <div class="missions-hero-actions" aria-label="Действия в лабораторията">
            <button
              class="missions-hero-button missions-hero-button-primary"
              type="button"
              aria-controls="mission-directions"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 3v18M3 12h18"></path>
                <path d="m12 3 2 3M12 3 10 6M12 21l2-3M12 21l-2-3"></path>
              </svg>
              <span>Вдъхнови се!</span>
            </button>
            <button
              class="missions-hero-button missions-hero-button-secondary"
              type="button"
              aria-controls="roles-section"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="8"></circle>
                <path d="M12 4v4M12 16v4M4 12h4M16 12h4"></path>
              </svg>
              <span>Как работим?</span>
            </button>
          </div>
        </div>
        <div class="missions-hero-visual">
          <img
            src="${discoverTogetherImage}"
            alt="Деца откриват България с карта и усмихнато AI роботче"
          />
        </div>
      </section>

      <section id="roles-section" class="roles-section mb-5" aria-labelledby="roles-title">
        <div class="roles-heading">
          <p class="eyebrow mb-2">Нашата образователна общност</p>
          <h2 id="roles-title" class="h3 mb-2">Как работим заедно?</h2>
          <p class="roles-intro mb-0">
            Избери своята роля и се включи в нашата образователна общност!
          </p>
        </div>
        <div class="row g-4 mt-1">
          <div class="col-md-4">
            <article class="role-panel h-100">
              <div class="role-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z"></path>
                  <path d="M6 11.5V16c2.9 2.4 9.1 2.4 12 0v-4.5"></path>
                  <path d="M21 10v5"></path>
                </svg>
              </div>
              <h3>За ученици</h3>
              <p>Откривай, учи и създавай свои идеи.</p>
              <button class="role-button" type="button" data-role="ученици">
                Вход за ученици
              </button>
              <p class="role-status" aria-live="polite"></p>
            </article>
          </div>
          <div class="col-md-4">
            <article class="role-panel h-100">
              <div class="role-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"></path>
                  <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"></path>
                  <path d="M8 7h8M8 10h6"></path>
                </svg>
              </div>
              <h3>За учители</h3>
              <p>Подготвяй и споделяй образователни идеи.</p>
              <button class="role-button" type="button" data-role="учители">
                Вход за учители
              </button>
              <p class="role-status" aria-live="polite"></p>
            </article>
          </div>
          <div class="col-md-4">
            <article class="role-panel h-100">
              <div class="role-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z"></path>
                  <path d="m8.5 12 2.2 2.2 4.8-4.8"></path>
                </svg>
              </div>
              <h3>Администрация</h3>
              <p>Грижи се за реда и развитието на платформата.</p>
              <button class="role-button" type="button" data-role="администратори">
                Вход в админ панела
              </button>
              <p class="role-status" aria-live="polite"></p>
            </article>
          </div>
        </div>
      </section>

      <section id="mission-directions" aria-labelledby="directions-title">
        <div class="section-heading mb-4">
          <div>
            <p class="eyebrow mb-2">Посоки за бъдещи приключения</p>
            <h2 id="directions-title" class="h3 mb-0">Какво ще откриваме?</h2>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-md-6">
            <article class="mission-card h-100">
              <span class="mission-card-mark" aria-hidden="true">01</span>
              <h3>Актуални мисии</h3>
              <p class="mb-0">
                Пространство за бъдещи образователни мисии, чрез които учениците
                ще изследват България, литературата, дигиталните умения и света около тях.
              </p>
            </article>
          </div>
          <div class="col-md-6">
            <article class="mission-card h-100">
              <span class="mission-card-mark" aria-hidden="true">02</span>
              <h3>Изследователски предизвикателства</h3>
              <p class="mb-0">
                Място за бъдещи любопитни въпроси и предизвикателства, които насърчават
                наблюдението, проучването, логическото мислене и откриването на връзки.
              </p>
            </article>
          </div>
          <div class="col-md-6">
            <article class="mission-card h-100">
              <span class="mission-card-mark" aria-hidden="true">03</span>
              <h3>Проекти и творчески идеи</h3>
              <p class="mb-0">
                Пространство за бъдещи индивидуални и екипни проекти, в които учениците
                ще могат да съчетават знания, въображение и дигитални инструменти.
              </p>
            </article>
          </div>
          <div class="col-md-6">
            <article class="mission-card h-100">
              <span class="mission-card-mark" aria-hidden="true">04</span>
              <h3>Моите открития</h3>
              <p class="mb-0">
                Бъдещо място за лични ученически впечатления, размисли и споделяне
                на наученото.
              </p>
            </article>
          </div>
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

document.querySelectorAll('.role-button').forEach((button) => {
  button.addEventListener('click', () => {
    const status = button.closest('.role-panel').querySelector('.role-status');
    status.textContent = `Входът за ${button.dataset.role} предстои.`;
  });
});

const scrollToSection = (sectionId) => {
  document.querySelector(`#${sectionId}`).scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  });
};

document
  .querySelector('.missions-hero-button-primary')
  .addEventListener('click', () => scrollToSection('mission-directions'));
document
  .querySelector('.missions-hero-button-secondary')
  .addEventListener('click', () => scrollToSection('roles-section'));
