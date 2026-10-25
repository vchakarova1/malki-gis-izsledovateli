import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';

const app = document.querySelector('#app');

app.innerHTML = `
  <div class="min-vh-100 d-flex flex-column">
    <header class="border-bottom bg-white">
      <nav class="container navbar navbar-expand-lg" aria-label="Основна навигация">
        <a class="navbar-brand fw-bold text-primary" href="/">Малки ГИС изследователи</a>
      </nav>
    </header>
    <main class="container flex-grow-1 py-5">
      <section class="hero-panel p-4 p-md-5 rounded-4">
        <p class="text-uppercase fw-semibold text-primary mb-2">Образователно пътешествие</p>
        <h1 class="display-5 fw-bold">Откриваме България с карта и любопитство</h1>
        <p class="lead mb-0">
          Предстои да изследваме географията, литературните забележителности и
          дигиталния свят заедно.
        </p>
      </section>
    </main>
    <footer class="border-top py-3">
      <div class="container text-body-secondary small">
        Малки ГИС изследователи
      </div>
    </footer>
  </div>
`;
