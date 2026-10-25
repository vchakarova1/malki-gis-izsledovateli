import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        map: 'map.html'
      }
    }
  },
  server: {
    open: true
  }
});
