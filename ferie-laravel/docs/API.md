# Holidays — API esterna

API REST in sola lettura per consumare i dati di Holidays da sistemi
terzi (es. il gestionale aziendale). Pensata per pull periodico (cron).

- **Base URL**: `https://<dominio-holidays>` (es. `https://holidays.up.railway.app`)
- **Auth**: Bearer token (Laravel Sanctum)
- **Formato**: JSON

## Endpoint disponibili

### `GET /api/v1/leaves/approved`

Richieste di assenza **approvate** aggiornate nel periodo richiesto.

**Query params**

| Nome | Obbligatorio | Tipo | Default | Note |
|---|---|---|---|---|
| `since` | sì | ISO-8601 | — | Limite inferiore **esclusivo** su `updated_at` (`> since`) |
| `until` | no | ISO-8601 | `now` | Limite superiore (incluso) |
| `types[]` | no | enum | tutti | Filtra tipo: `FERIE`, `MALATTIA`, `PERMESSO` |

Per i `PERMESSO`, oltre a `start_date` / `end_date` (uguali, è il giorno), sono valorizzati anche i campi `start_time` / `end_time` (`HH:MM`). Per FERIE e MALATTIA quei campi sono `null`. `requested_units` per PERMESSO è il numero di ore (derivato lato server da `end_time - start_time`).
| `limit` | no | int | 500 | Max 1000 |

**Risposta `200`**

```json
{
  "data": [
    {
      "id": "39",
      "leave_type_code": "FERIE",
      "leave_type_label": "Ferie",
      "unit": "days",
      "requested_units": 3,
      "start_date": "2026-05-01",
      "end_date": "2026-05-05",
      "start_time": null,
      "end_time": null,
      "note_user": null,
      "note_admin": null,
      "sick_certificate_puc": null,
      "has_attachment": false,
      "approved_at": "2026-04-23T14:33:20+00:00",
      "created_at": "2026-04-23T14:30:11+00:00",
      "employee": {
        "id": "5",
        "email": "marco@holidays.test",
        "first_name": "Marco",
        "last_name": "Bianchi",
        "full_name": "Marco Bianchi",
        "job_role": "Developer"
      }
    }
  ],
  "meta": {
    "count": 1,
    "since": "2026-04-23T13:00:00+00:00",
    "until": "2026-06-10T13:14:21+00:00",
    "next_since": "2026-04-23T14:33:20+00:00",
    "limit": 500,
    "types": null
  }
}
```

**Cursor incrementale**: `meta.next_since` è il timestamp dell'ultima
riga restituita (o `until` se vuoto). Salvalo lato client e passalo
come `since` nella chiamata successiva → ottieni solo le novità,
nessuno stato lato server.

**Errori**

| Codice | Quando |
|---|---|
| `401` | Token mancante o non valido |
| `422` | Parametri non validi (es. `since` mancante, `until < since`, `types` non in enum) |

## Autenticazione

Tutte le route richiedono il header:

```
Authorization: Bearer <token>
Accept: application/json
```

I token sono emessi via artisan command dentro al container Holidays:

```
php artisan api:issue-token <label>
```

Esempi:

```
php artisan api:issue-token gestionale-prod
php artisan api:issue-token reporting-bi --user=admin@holidays.app
```

Il token viene stampato **una sola volta** sull'output del comando —
copialo subito nei secret del client. I token non sono scaduti di
default; per revocarne uno, rilanciare il comando con lo stesso label
(rigenera) oppure cancellare la riga da `personal_access_tokens` nel
DB.

Senza `--user`, il comando crea/usa un service account dedicato
(`api@holidays.app`, ruolo `service`) — preferibile a usare un account
admin reale.

## Integrazione lato gestionale (Laravel)

**1. Configurazione**

In `config/services.php` (o un `config/holidays.php` dedicato):

```php
'holidays' => [
    'base_url' => env('HOLIDAYS_API_URL'),
    'token'    => env('HOLIDAYS_API_TOKEN'),
],
```

In `.env` del gestionale:

```
HOLIDAYS_API_URL=https://holidays.up.railway.app
HOLIDAYS_API_TOKEN=1|xxxxxxxxxxxxxxxx
```

**2. Service di sync**

```php
namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class HolidaysSync
{
    public function pullApprovedLeaves(): int
    {
        $since = Cache::get('holidays.last_sync')
            ?? now()->subDay()->toIso8601String();

        $response = Http::withToken(config('services.holidays.token'))
            ->acceptJson()
            ->get(config('services.holidays.base_url').'/api/v1/leaves/approved', [
                'since' => $since,
            ])
            ->throw();

        $payload = $response->json();

        foreach ($payload['data'] as $leave) {
            // upsert nella tua tabella usando $leave['id'] come chiave esterna
            // \App\Models\PermessoDipendente::updateOrCreate(
            //     ['holidays_id' => $leave['id']],
            //     [
            //         'dipendente_email' => $leave['employee']['email'],
            //         'tipo'             => $leave['leave_type_code'],
            //         'data_inizio'      => $leave['start_date'],
            //         'data_fine'        => $leave['end_date'],
            //         'quantita'         => $leave['requested_units'],
            //         'approvato_il'     => $leave['approved_at'],
            //     ],
            // );
        }

        Cache::put('holidays.last_sync', $payload['meta']['next_since'], now()->addDays(30));

        return $payload['meta']['count'];
    }
}
```

**3. Schedulazione (cron orario)**

In `routes/console.php` o `app/Console/Kernel.php`:

```php
use App\Services\HolidaysSync;
use Illuminate\Support\Facades\Schedule;

Schedule::call(fn () => app(HolidaysSync::class)->pullApprovedLeaves())
    ->hourly()
    ->name('holidays-sync')
    ->withoutOverlapping();
```

Sul server (Forge ecc.) assicurati che `php artisan schedule:run` sia
chiamato ogni minuto dal cron di sistema (è il default su Forge).

**4. Idempotenza**

L'endpoint può restituire più volte lo stesso record (se `updated_at`
ricade nel range). Usa `updateOrCreate` chiavando sulla coppia
(`holidays_id`) — niente duplicati.

## Sviluppi futuri (non ancora implementati)

Endpoint candidati, da aggiungere quando servono:

- `GET /api/v1/employees` — anagrafica dipendenti (per sync inversa)
- `GET /api/v1/employees/{id}/balance` — saldo ferie corrente
- Webhook push da Holidays su evento approvazione (`POST` configurato
  da admin a un URL del gestionale)
