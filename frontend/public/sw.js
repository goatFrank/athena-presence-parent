const CACHE_NAME = 'athena-v1';

self.addEventListener('install', (event) => {
    // Perform install steps
    console.log('Athena Service Worker: Installed');
});

self.addEventListener('activate', (event) => {
    console.log('Athena Service Worker: Activated');
});

self.addEventListener('fetch', (event) => {
    // Current minimalist approach: just let the browser handle the fetch
    // This allows the app to be 'installable' in Chrome/Android
});
