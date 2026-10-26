import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import './map-page.css';

const arcgisUrl =
  'https://www.arcgis.com/apps/instant/nearby/index.html?appid=5e8bd330b9ae4519be093bd70132b790';
const app = document.querySelector('#map-app');

app.innerHTML = `
  <div class="map-page-shell min-vh-100 d-flex flex-column">
    <header class="site-header">
      <nav class="container navbar navbar-expand-lg py-3" aria-label="Основна навигация">
        <a class="navbar-brand brand-mark fw-bold" href="index.html" aria-label="Към началната страница">
          <span class="brand-icon" aria-hidden="true">🧭</span>
          <span>Малки ГИС изследователи</span>
        </a>
        <a class="map-back-link" href="index.html">Към началната страница</a>
      </nav>
    </header>

    <main class="container flex-grow-1 py-4 py-md-5">
      <section class="map-intro mb-4" aria-labelledby="map-page-title">
        <p class="eyebrow mb-2">Твоето картографско приключение</p>
        <h1 id="map-page-title">Изследвай България</h1>
        <p class="map-subtitle mb-0">
          Откривай места, свързвай истории и създавай свои маршрути!
        </p>
      </section>

      <section class="map-card" aria-labelledby="map-title">
        <div class="map-card-heading">
          <div>
            <p class="eyebrow mb-1">Интерактивна карта</p>
            <h2 id="map-title" class="h4 mb-0">Открий следващото си място</h2>
          </div>
          <a class="map-external-link" href="${arcgisUrl}" target="_blank" rel="noopener noreferrer">
            Отвори в нов раздел
          </a>
        </div>
        <div class="map-frame-wrap">
          <iframe
            id="arcgis-map"
            title="Интерактивна ArcGIS карта на България"
            src="${arcgisUrl}"
            loading="eager"
            allow="geolocation"
            allowfullscreen
          >iFrames не се поддържат на тази страница.</iframe>
          <div id="map-fallback" class="map-fallback" role="alert" hidden>
            <p class="mb-3">
              Картата не се зареди. Можеш да я отвориш в нов раздел или да опиташ отново.
            </p>
            <div class="d-flex flex-wrap gap-2">
              <a class="btn btn-primary" href="${arcgisUrl}" target="_blank" rel="noopener noreferrer">
                Отвори картата
              </a>
              <button id="map-retry" class="btn btn-outline-secondary" type="button">
                Опитай отново
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="map-steps mt-4" aria-labelledby="steps-title">
        <div class="map-steps-heading">
          <p class="eyebrow mb-1">Три лесни стъпки</p>
          <h2 id="steps-title" class="h4 mb-0">Как да изследваш?</h2>
        </div>
        <div class="row g-3 mt-1">
          <div class="col-md-4">
            <article class="map-step h-100">
              <span class="map-step-number" aria-hidden="true">1</span>
              <h3 class="h6">Разгледай картата</h3>
              <p class="mb-0">Открий интересни места и виж какво има около тях.</p>
            </article>
          </div>
          <div class="col-md-4">
            <article class="map-step h-100">
              <span class="map-step-number" aria-hidden="true">2</span>
              <h3 class="h6">Избери обект</h3>
              <p class="mb-0">Натисни върху място, за да видиш наличната информация.</p>
            </article>
          </div>
          <div class="col-md-4">
            <article class="map-step h-100">
              <span class="map-step-number" aria-hidden="true">3</span>
              <h3 class="h6">Открий идея за маршрут</h3>
              <p class="mb-0">Свържи откритията си и си представи собствено пътуване.</p>
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

const iframe = document.querySelector('#arcgis-map');
const fallback = document.querySelector('#map-fallback');
const retryButton = document.querySelector('#map-retry');
let loadTimeout;

const showFallback = () => {
  fallback.hidden = false;
};

const startLoadCheck = () => {
  window.clearTimeout(loadTimeout);
  fallback.hidden = true;
  loadTimeout = window.setTimeout(showFallback, 10000);
};

iframe.addEventListener('load', () => {
  window.clearTimeout(loadTimeout);
});
iframe.addEventListener('error', showFallback);
retryButton.addEventListener('click', () => {
  iframe.src = `${arcgisUrl}&retry=${Date.now()}`;
  startLoadCheck();
});

startLoadCheck();
