# Holidays — gestionale ferie bitboss

Successore di `ferie` — stesso stack (Laravel + Inertia.js + React), redesign V1 Pragmatica.

## Avvio con hot reload (modifiche live)

**Importante:** servono **entrambi** i processi per vedere le modifiche senza ricaricare.

```bash
# Dalla root del progetto
npm run start
```

Poi apri [http://localhost:8000](http://localhost:8000) (o 8003 se 8000 è occupata).

### Se le modifiche non si vedono

1. Controlla che nel terminale ci siano **due** processi attivi: `laravel` e `vite`
2. Se vedi solo Laravel, Vite non è partito: riavvia con `npm run start`
3. Fai un hard refresh nel browser: **Cmd+Shift+R** (Mac) o **Ctrl+Shift+R** (Windows)

### Alternativa: build + watch (richiede refresh manuale)

```bash
# Terminale 1
cd ferie-laravel && php artisan serve

# Terminale 2 – ricompila ad ogni modifica
cd ferie-laravel && npm run dev:watch
```

Poi ricarica la pagina per vedere le modifiche.

### Altri comandi

```bash
# Build produzione (una tantum)
npm run build
```

## Struttura

- `ferie-laravel/` – applicazione Laravel con Inertia.js e React
