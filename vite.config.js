import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        map: 'map.html',
        missions: 'missions.html',
        auth: 'auth.html',
        profile: 'profile.html',
        student: 'student.html'
      }
    }
  },
  server: {
    open: true
  }
});
