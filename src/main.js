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
            <a class="btn btn-light btn-lg px-4" href="#about">Как работи?</a>
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
        <div class="row g-3">
          <div class="col-md-4">
            <article class="explore-card h-100">
              <span class="card-icon" aria-hidden="true"></span>
              <h3 class="h5 fw-bold">Детска ГИС карта</h3>
              <p class="mb-0">Пътувай по картата и опознавай природата на България.</p>
            </article>
          </div>
          <div class="col-md-4">
            <article class="explore-card h-100">
              <span class="card-icon" aria-hidden="true"></span>
              <h3 class="h5 fw-bold">Литературни маршрути</h3>
              <p class="mb-0">Открий историите и местата, вдъхновили български автори.</p>
            </article>
          </div>
          <div class="col-md-4">
            <article class="explore-card h-100">
              <span class="card-icon" aria-hidden="true"></span>
              <h3 class="h5 fw-bold">Бъди ГИС откривател</h3>
              <p class="mb-0">Учи, наблюдавай и мисли като истински изследовател.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="about" class="about-panel p-4 rounded-4 mb-4" aria-labelledby="about-title">
        <div>
          <p class="eyebrow mb-2">Малка крачка, голямо откритие</p>
          <h2 id="about-title" class="h4 fw-bold mb-2">Учим заедно, стъпка по стъпка.</h2>
          <p class="mb-0 text-body-secondary">
            Избираш тема, разглеждаш картата и споделяш какво си открил.
          </p>
        </div>
        <span class="about-icon" aria-hidden="true"></span>
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
