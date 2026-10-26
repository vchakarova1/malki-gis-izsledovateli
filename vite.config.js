import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        map: 'map.html',
        missions: 'missions.html'
      }
    }
  },
  server: {
    open: true
  }
});
