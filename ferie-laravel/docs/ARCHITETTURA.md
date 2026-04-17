# Piattaforma ferie — stato attuale

Documento di riferimento su stack, schema dati e funzionalità effettivamente implementate nell'applicazione `ferie-laravel`.

---

## Stack tecnologico

| Livello | Tecnologie |
|--------|------------|
| **Backend** | PHP **8.2+**, **Laravel 12** |
| **Frontend** | **Inertia.js** (`inertiajs/inertia-laravel` + `@inertiajs/react`), **React 18** |
| **Build / CSS** | **Vite 7**, **Tailwind CSS** 3, `@tailwindcss/vite` 4, **PostCSS**, **Headless UI** |
| **Date UI** | **date-fns** 4, **react-day-picker** 9 |
| **Auth / sessione** | Pattern **Laravel Breeze**, **Laravel Sanctum**, verifica email disponibile nelle route auth |
| **Notifiche email** | **Laravel Notifications** via canale `mail`; pacchetto **`resend/resend-laravel`** installato |
| **Route da JS** | **Ziggy** (`tightenco/ziggy`) |
| **Database** | Configurabile via `.env`; supporto bootstrap rapido con **SQLite** |
| **Test** | **PHPUnit 11** |

Script utili:

- `composer run dev` — `php artisan serve` + `queue:listen` + `pail` + `vite`
- `composer test` — pulizia config + test Laravel
- `npm run dev` / `npm run build` — asset frontend

---

## Schema database (migrations)

### `users`

- Campi standard Laravel: `id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `timestamps`
- Estensioni dominio: `first_name`, `last_name`, `role` (default `user`), `active` (boolean, default `true`), `job_role` (nullable)
- Ruoli applicativi osservati nel codice: `user`, `admin`
- Ruoli professionali gestiti in validazione: `Designer`, `PM`, `Developer`, `Socio`

### `password_reset_tokens`, `sessions`

Tabelle standard Laravel per reset password e sessioni persistenti.

### `leave_types` (PK string `code`)

- Base: `description`, `deducts_balance`, `unit` (`days` | `hours`), `active`, `timestamps`
- Regole configurabili: `requires_attachment`, `max_consecutive_days`, `notice_days_required`, `accrual_rule`

### `leave_balances`

- `id`, `user_id` → `users` (cascade), `year`, `allocated_days`, `used_days`, `timestamps`
- Vincolo unico `(user_id, year)`

### `leave_requests`

- `id`, `user_id`, `leave_type_code` → `leave_types.code`
- `start_date`, `end_date`, `requested_units`
- `status` con stati usati nel codice: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`
- `note_user`, `note_admin`, `approved_days`, `timestamps`
- Allegati (opzionali): `attachment_path`, `attachment_original_name`, `attachment_mime`, `attachment_size`
- Malattia: `sick_certificate_puc` (numero protocollo certificato comunicato dal lavoratore)
- `approved_days` viene valorizzato in approvazione admin e azzerato in caso di revoca

### `leave_accruals`

- Tabella di supporto per maturazione/rollover (audit e carry-over)
- `user_id`, `year`, `total_days`, `must_use_within_year_days`, `used_days_at_rollover`, `carryover_days`, `carryover_expires_at`, `timestamps`

### `company_holidays`

- `date` (unique), `description`, `timestamps`
- È popolata sia tramite comando artisan dedicato sia automaticamente dalla dashboard per l'intervallo di calendario mostrato

### Tabelle framework

- `cache`, `jobs` (migrations Laravel standard)

### Tipi di assenza (seed `LeaveTypeSeeder`)

| Codice | Descrizione | Scala saldo | Unità |
|--------|-------------|-------------|-------|
| `FERIE` | Ferie | sì | `days` |
| `MALATTIA` | Malattia | no | `days` |
| `PERMESSO` | Permesso | no | `hours` |
| `ROL` | ROL | sì | `hours` |

Nota: il seed contiene `ROL`, ma la validazione attuale di `LeaveRequestController@store` accetta solo `FERIE`, `MALATTIA`, `PERMESSO`.

---

## Funzionalità

### Autenticazione e profilo

- Registrazione pubblica disponibile su `/register`
- La registrazione richiede `first_name`, `last_name`, `job_role`, `email`, `password`
- Dopo la registrazione l'utente viene autenticato subito e reindirizzato a `/dashboard`
- Login, logout, reset password e verifica email sono esposti in `routes/auth.php`
- Profilo utente: modifica dati, aggiornamento password, eliminazione account (`ProfileController`)
- All'atto della registrazione e della creazione utente da admin viene inviata una `WelcomeNotification` email

### Routing principale (`/`)

- Visitatore non autenticato → redirect a `login`
- Utente autenticato → redirect a `dashboard`

### Dashboard (`/dashboard`) — utente autenticato e verificato

- Elenco delle proprie richieste di assenza
- Saldo ferie per `year` (query `?year=`) con `total`, `used`, `remaining`
- Calendario assenze approvate di tutti gli utenti per una finestra che va da inizio anno precedente a fine anno successivo
- Restituzione al frontend dell'elenco `companyHolidays` per la stessa finestra temporale
- Auto-popolamento di `company_holidays` con festività nazionali italiane mancanti nel range del calendario
- Form di creazione richiesta su `POST /dashboard/request`
- Annullamento di una propria richiesta in attesa su `PATCH /dashboard/request/{leaveRequest}/cancel`
- Download allegato richiesta su `GET /dashboard/request/{leaveRequest}/attachment` (solo proprietario o admin)

Regole di creazione richiesta:

- Tipi ammessi in validazione: `FERIE`, `MALATTIA`, `PERMESSO`
- Per i tipi a giorni, `requested_units` viene calcolato automaticamente come giorni lavorativi tra inizio e fine
- Il calcolo usa `App\Helpers\WorkingDays` ed esclude weekend e date presenti in `company_holidays`
- Preavviso: se definito su `leave_types.notice_days_required`, la data inizio deve rispettarlo
- Massimo consecutivo: se definito su `leave_types.max_consecutive_days`, i giorni lavorativi richiesti non possono superarlo
- Allegato obbligatorio: se `leave_types.requires_attachment` è true, `attachment` è required (PDF/JPG/PNG, max 2MB)
- Per `MALATTIA`: `sickCertificatePuc` è obbligatorio (numero protocollo certificato — PUC)
- Per `FERIE`, se il tipo scala il saldo, viene verificato il residuo disponibile dell'anno corrente
- Le richieste nascono in stato `PENDING`
- Non esiste un vincolo bloccante di sovrapposizione tra dipendenti diversi
- Se nel periodo esiste già una richiesta approvata di un altro utente con lo stesso `job_role`, il sistema genera un warning informativo ma non blocca l'inserimento
- Alla creazione viene inviata una `LeaveRequestSubmitted` agli admin attivi

### Dashboard — estensioni admin nella stessa pagina Inertia

- Lista dipendenti attivi non admin per inserire richieste per conto di altri utenti
- Snapshot saldi per dipendente (`employeesWithBalances`)
- Coda richieste `PENDING`
- Liste paginate di richieste `APPROVED` e `REJECTED`
- Sulle richieste pending viene calcolato un `roleConflictWarning` in caso di sovrapposizione per `job_role`

### Area admin (`/admin/*`, middleware `auth` + `admin`)

- `GET /admin/users`: anagrafica dipendenti attivi con filtro anno `?year=`
- `GET /admin/reports/export-leaves`: export CSV richieste per `?year=` (streaming)
- `POST /admin/users`: crea un utente non-admin con nome, cognome, email, password e `jobRole`
- `PATCH /admin/users/{user}/balance`: upsert del budget ferie per anno
- `DELETE /admin/users/{user}`: elimina l'utente, con blocco esplicito se il target è admin
- `PATCH /admin/requests/{leaveRequest}/approve`: approva la richiesta e salva `approved_days`
- `PATCH /admin/requests/{leaveRequest}/reject`: rifiuta la richiesta e salva eventuale `note_admin`
- `PATCH /admin/requests/{leaveRequest}/revoke`: revoca una richiesta approvata e la riporta a `PENDING`
- `DELETE /admin/requests/{leaveRequest}`: elimina una richiesta

Note sul saldo ferie lato admin:

- La vista utenti admin usa `LeaveRequest::sumDeductibleApprovedDaysByUserForYear($year)` per calcolare i giorni usati da richieste approvate che scalano il budget e hanno unità `days`
- L'approvazione admin non aggiorna più esplicitamente `leave_balances.used_days`; il dato affidabile lato dominio è la somma delle richieste approvate filtrate per anno
- In dashboard admin, `employeesWithBalances.used` è calcolato con la stessa logica canonica (non usa più `used_days`)

### Festività aziendali / nazionali

- `App\Helpers\ItalianNationalHolidays` genera le festività nazionali italiane fisse più `Pasqua` e `Lunedì dell'Angelo`
- `routes/console.php` definisce il comando `holidays:seed-it`
- `routes/console.php` definisce anche `leaves:rollover` (carry-over con scadenza 18 mesi, tabella `leave_accruals`)
- Opzioni supportate: `--year=`, `--from=`, `--to=`, `--dry-run`
- La dashboard esegue un `insertOrIgnore` per garantire la presenza delle festività nel periodo visualizzato

### Notifiche email

- `WelcomeNotification`: inviata a registrazione pubblica e creazione utente da admin
- `LeaveRequestSubmitted`: inviata agli admin attivi alla creazione di una richiesta
- `LeaveRequestStatusChanged`: inviata al dipendente quando una richiesta viene approvata o rifiutata
- Le notifiche sono protette da `try/catch`: l'errore viene loggato ma non blocca il flusso principale

### UI / navigazione

- App Inertia principale sulla pagina `Dashboard`
- Root `/` come redirect intelligente login/dashboard
- Presenza di UX dedicate per calendario approvazioni, dettaglio richiesta e flussi mobile nei commit recenti

### Test

- `tests/Feature/Auth/*` copre autenticazione, registrazione, reset password, verifica email e aggiornamento password
- `tests/Feature/ProfileTest.php` copre il profilo
- `tests/Feature/LeaveRequestConcurrentTest.php` copre scenari richieste/concorrenza

---

## Relazioni Eloquent

- `User` → `hasMany` `LeaveRequest`, `LeaveBalance`
- `LeaveRequest` → `belongsTo` `User`, `LeaveType` (chiave `leave_type_code`)
- `LeaveBalance` → `belongsTo` `User`
- `LeaveType` (PK `code`) → `hasMany` `LeaveRequest`

---

## Note operative

- `company_holidays` è ora parte attiva del calcolo dei giorni lavorativi; la nota precedente che la descriveva come non utilizzata non è più valida.
- `leave_balances.used_days` è considerato **deprecato** a livello applicativo: il calcolo canonico dei giorni usati deriva dalle richieste `APPROVED` che scalano budget (per anno).
- `ROL` esiste come tipo anagrafico, ma non è selezionabile nel flusso di creazione richieste attuale senza modifiche alla validazione/UI.
- Le notifiche email sono "best effort": eventuali failure vengono loggate ma non mostrano errore bloccante all'utente.

*Ultimo allineamento al codice: aprile 2026.*
