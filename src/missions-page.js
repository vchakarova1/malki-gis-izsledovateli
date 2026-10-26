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
          <p class="missions-hero-lead mb-0">
            Тук ще събираме бъдещи учебни мисии, изследователски предизвикателства
            и творчески идеи, с които всяко дете може да задава въпроси и да открива
            нови знания.
          </p>
        </div>
        <div class="missions-hero-visual">
          <img
            src="${discoverTogetherImage}"
            alt="Деца откриват България с карта и усмихнато AI роботче"
          />
        </div>
      </section>

      <section aria-labelledby="directions-title">
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
