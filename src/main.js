import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import discoverBulgariaImage from './images/Discover-Bulgaria.png';

const app = document.querySelector('#app');

app.innerHTML = `
  <div class="site-shell min-vh-100 d-flex flex-column">
    <header class="site-header">
      <nav class="container navbar navbar-expand-lg py-3" aria-label="Основна навигация">
        <a class="navbar-brand brand-mark fw-bold" href="/" aria-label="Начало">
          <span class="brand-icon" aria-hidden="true">🧭</span>
          <span>Малки ГИС изследователи</span>
        </a>
        <a class="header-badge d-none d-md-inline-flex" href="map.html">Учим чрез откриване</a>
      </nav>
    </header>
    <main class="container flex-grow-1 py-4 py-md-5">
      <section class="hero-panel p-4 p-md-5 rounded-4" aria-labelledby="welcome-title">
        <div class="hero-copy">
          <p class="eyebrow mb-3">Образователно пътешествие</p>
          <h1 id="welcome-title" class="display-4 fw-bold mb-3">
            Пътуване през България с карта и любознание
          </h1>
          <p class="hero-lead mb-4">
            Изследвай места, истории и идеи. Всяко откритие започва с един въпрос.
          </p>
          <div class="d-flex flex-wrap gap-3" aria-label="Основни действия">
            <a class="btn btn-primary btn-lg px-4" href="map.html">
              Започни приключението!
            </a>
            <a class="btn btn-light btn-lg px-4" href="#explore">Как работи?</a>
          </div>
        </div>
        <div class="hero-illustration">
          <img
            src="${discoverBulgariaImage}"
            alt="Илюстрирана карта на България с географски пинове и културни забележителности"
          />
        </div>
      </section>

      <section id="explore" class="explore-section py-5" aria-labelledby="explore-title">
        <div class="section-heading mb-4">
          <p class="eyebrow mb-2">Твоите следващи открития</p>
          <h2 id="explore-title" class="h3 fw-bold mb-0">Избери посока</h2>
        </div>
        <div class="explore-carousel" aria-roledescription="карусел" aria-label="Образователни направления">
          <div id="explore-track" class="explore-track" aria-live="polite"></div>
          <div class="carousel-controls">
            <button id="carousel-previous" class="carousel-control" type="button" aria-label="Предишна карта">
              <span aria-hidden="true">←</span>
            </button>
            <div id="carousel-indicators" class="carousel-indicators" aria-label="Позиция в карусела"></div>
            <button id="carousel-next" class="carousel-control" type="button" aria-label="Следваща карта">
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      <section id="about" class="about-panel p-4 rounded-4 mb-4" aria-labelledby="about-title">
        <div class="scroll-content">
          <p class="eyebrow mb-2">Малка крачка, голямо откритие</p>
          <h2 id="about-title" class="h4 fw-bold mb-2">Учим заедно, стъпка по стъпка.</h2>
          <p class="mb-0 text-body-secondary">
            Избираш тема, разглеждаш картата и споделяш какво си открил.
          </p>
          <button id="scroll-toggle" class="scroll-toggle" type="button" aria-expanded="false" aria-controls="scroll-secret">
            <span class="key-icon" aria-hidden="true">⚿</span>
            <span>Отключи тайната!</span>
          </button>
        </div>
        <span class="about-icon" aria-hidden="true"></span>
        <div id="scroll-secret" class="scroll-secret" aria-hidden="true">
          <div class="secret-copy">
            <h3 class="h5 fw-bold">Нашата идея</h3>
            <p>Учим чрез откриване, изследване и задаване на въпроси.</p>
            <h3 class="h5 fw-bold">Нашата мисия</h3>
            <p>Опознаваме България, нейните места и истории чрез интерактивна карта.</p>
            <h3 class="h5 fw-bold">Как работи картата</h3>
            <p>Избираме място, разглеждаме информацията и откриваме връзки между география, история, литература и дигитални умения.</p>
            <a class="missions-link" href="missions.html">Открий следващата мисия!</a>
          </div>
        </div>
      </section>
    </main>
    <footer class="site-footer border-top py-3">
      <div class="container text-body-secondary small">
        <span>Малки ГИС изследователи</span>
        <span aria-hidden="true"> · </span>
        <span>Любопитството води напред</span>
      </div>
    </footer>
  </div>
`;

const learningPaths = [
  {
    title: 'Детска ГИС карта',
    description: 'Пътувай по картата и опознавай природата на България.'
  },
  {
    title: 'Литературни маршрути',
    description: 'Открий историите и местата, вдъхновили български автори.'
  },
  {
    title: 'Бъди ГИС откривател',
    description: 'Учи, наблюдавай и мисли като истински изследовател.'
  },
  {
    title: 'Дигитални умения',
    description: 'Учи се да търсиш, сравняваш и споделяш откритията си с помощта на технологиите.'
  }
];

const exploreTrack = document.querySelector('#explore-track');
const carouselIndicators = document.querySelector('#carousel-indicators');
let activePath = 0;
let touchStartX = 0;

const renderCarousel = () => {
  exploreTrack.innerHTML = learningPaths
    .map(
      (path, index) => `
        <article class="explore-card${index === activePath ? ' is-active' : ''}" tabindex="${
          index === activePath ? '0' : '-1'
        }" ${
          index === activePath ? '' : 'aria-hidden="true"'
        }>
          <span class="card-icon" aria-hidden="true"></span>
          <h3 class="h5 fw-bold">${path.title}</h3>
          <p class="mb-0">${path.description}</p>
        </article>
      `
    )
    .join('');

  carouselIndicators.innerHTML = learningPaths
    .map(
      (path, index) => `
        <button
          class="carousel-indicator${index === activePath ? ' is-active' : ''}"
          type="button"
          aria-label="Покажи карта ${index + 1}: ${path.title}"
          aria-current="${index === activePath ? 'true' : 'false'}"
          data-carousel-index="${index}"
        ></button>
      `
    )
    .join('');
};

const moveCarousel = (step) => {
  activePath = (activePath + step + learningPaths.length) % learningPaths.length;
  renderCarousel();
};

document.querySelector('#carousel-previous').addEventListener('click', () => moveCarousel(-1));
document.querySelector('#carousel-next').addEventListener('click', () => moveCarousel(1));
carouselIndicators.addEventListener('click', (event) => {
  const indicator = event.target.closest('[data-carousel-index]');
  if (indicator) {
    activePath = Number(indicator.dataset.carouselIndex);
    renderCarousel();
  }
});

exploreTrack.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    moveCarousel(-1);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    moveCarousel(1);
  }
});
exploreTrack.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].screenX;
}, { passive: true });
exploreTrack.addEventListener('touchend', (event) => {
  const distance = event.changedTouches[0].screenX - touchStartX;
  if (Math.abs(distance) > 40) {
    moveCarousel(distance < 0 ? 1 : -1);
  }
}, { passive: true });

renderCarousel();

const scrollToggle = document.querySelector('#scroll-toggle');
const scrollSecret = document.querySelector('#scroll-secret');
scrollToggle.addEventListener('click', () => {
  const isOpen = scrollToggle.getAttribute('aria-expanded') === 'true';
  scrollToggle.setAttribute('aria-expanded', String(!isOpen));
  scrollSecret.setAttribute('aria-hidden', String(isOpen));
  scrollSecret.classList.toggle('is-open', !isOpen);
});
