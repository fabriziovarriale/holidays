<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\LeaveBalance;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SsoLoginController extends Controller
{
    /**
     * Redirect verso bbos /sso/authorize. Generiamo uno `state` random e
     * lo salviamo in sessione: il callback verifica che combaci, così
     * un attaccante non può forgiare il redirect di ritorno.
     */
    public function redirect(Request $request): RedirectResponse
    {
        // Deep-link opzionale: dove atterrare su Holidays dopo l'auth (es.
        // /requests?create=1 per aprire lo slideover "Nuova richiesta").
        // Solo path interni relativi, per evitare open-redirect.
        $next = $this->sanitizeNext((string) $request->query('next', ''));

        // Passiamo SEMPRE da bbos, anche se già loggati su Holidays: bbos è la
        // fonte di verità dell'identità. Se l'utente bbos è diverso da quello
        // in sessione qui, il callback cambierà identità di conseguenza.
        $config = config('sso.bbos');
        if (empty($config['base_url']) || empty($config['client_id'])) {
            abort(500, 'SSO non configurato.');
        }

        $state = Str::random(40);
        $request->session()->put('sso.bbos.state', $state);
        $request->session()->put('sso.bbos.next', $next);

        $query = http_build_query([
            'client_id' => $config['client_id'],
            'redirect'  => route('sso.bbos.callback'),
            'state'     => $state,
        ]);

        return redirect()->away($config['base_url'].'/sso/authorize?'.$query);
    }

    /**
     * Callback: bbos torna con `?ticket=...&state=...`. Verifichiamo lo
     * state, scambiamo il ticket server-to-server contro bbos e facciamo
     * provisioning JIT dell'utente: bbos è la fonte di verità, quindi
     * creiamo/aggiorniamo l'utente locale coi dati ricevuti e lo loggiamo.
     * `job_role` resta gestito a mano su Holidays (bbos non lo espone).
     */
    public function callback(Request $request): RedirectResponse
    {
        $config = config('sso.bbos');

        $expectedState = (string) $request->session()->pull('sso.bbos.state', '');
        $receivedState = (string) $request->query('state', '');
        if ($expectedState === '' || ! hash_equals($expectedState, $receivedState)) {
            return redirect()->route('login')->withErrors([
                'email' => 'Sessione SSO non valida. Riprova.',
            ]);
        }

        $ticket = (string) $request->query('ticket', '');
        if ($ticket === '') {
            return redirect()->route('login')->withErrors([
                'email' => 'Ticket SSO mancante.',
            ]);
        }

        $signature = hash_hmac(
            'sha256',
            $config['client_id'].'|'.$ticket,
            $config['shared_secret']
        );

        $response = Http::timeout($config['http_timeout'])
            ->acceptJson()
            ->asForm()
            ->post($config['base_url'].'/api/sso/exchange', [
                'client_id' => $config['client_id'],
                'ticket'    => $ticket,
                'signature' => $signature,
            ]);

        if (! $response->successful()) {
            logger()->warning('SSO exchange failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            return redirect()->route('login')->withErrors([
                'email' => 'Accesso via bbos rifiutato.',
            ]);
        }

        $data   = $response->json();
        $email  = trim((string) ($data['email'] ?? ''));
        $bbosId = (int) ($data['id'] ?? 0);
        if ($email === '' || $bbosId === 0) {
            return redirect()->route('login')->withErrors([
                'email' => 'Risposta SSO incompleta.',
            ]);
        }

        // bbos è la fonte di verità: se l'utente è disattivato lì, niente accesso.
        if (array_key_exists('is_active', $data) && ! $data['is_active']) {
            return redirect()->route('login')->withErrors([
                'email' => 'Account bbos disattivato. Contatta un amministratore.',
            ]);
        }

        $firstName = trim((string) ($data['name'] ?? ''));
        $lastName  = trim((string) ($data['last_name'] ?? ''));
        $isAdmin   = (bool) ($data['is_admin'] ?? false);

        // Match per bbos_id; in fallback per email, così i vecchi account
        // (seed / creati a mano per test) vengono riagganciati e ricevono
        // il bbos_id al primo login SSO.
        $user = User::where('bbos_id', $bbosId)->first()
            ?? User::where('email', $email)->first();

        if (! $user) {
            $user = new User();
            // Login via SSO: la password locale non viene mai usata.
            $user->password = Str::random(40);
        }

        $user->bbos_id    = $bbosId;
        $user->email      = $email;
        $user->first_name = $firstName;
        $user->last_name  = $lastName;
        $user->name       = trim($firstName.' '.$lastName) ?: $email;
        // `role` e `active` sono guarded: assegnazione esplicita. Comanda bbos.
        $user->role       = $isAdmin ? 'admin' : 'user';
        $user->active     = true;
        // NB: `job_role` non è gestito da bbos → resta quello impostato dall'admin.
        $user->save();

        // Budget ferie di default per l'anno corrente (se non già presente).
        LeaveBalance::firstOrCreate(
            ['user_id' => $user->id, 'year' => now()->year],
            ['allocated_days' => LeaveBalance::DEFAULT_ALLOCATED_DAYS, 'used_days' => 0],
        );

        $next = $request->session()->pull('sso.bbos.next');

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        if ($next) {
            return redirect()->to($next);
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Ammette solo path interni relativi ("/qualcosa"). Scarta URL assoluti,
     * protocol-relative ("//host") e schemi (http:, javascript:) per evitare
     * open-redirect. Ritorna null se non valido.
     */
    private function sanitizeNext(string $next): ?string
    {
        if ($next === '') {
            return null;
        }
        if (! str_starts_with($next, '/') || str_starts_with($next, '//')) {
            return null;
        }
        if (str_contains($next, '://') || str_contains($next, '\\')) {
            return null;
        }

        return $next;
    }
}
