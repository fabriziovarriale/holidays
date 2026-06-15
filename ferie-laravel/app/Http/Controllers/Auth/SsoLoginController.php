<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
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
        $config = config('sso.bbos');
        if (empty($config['base_url']) || empty($config['client_id'])) {
            abort(500, 'SSO non configurato.');
        }

        $state = Str::random(40);
        $request->session()->put('sso.bbos.state', $state);

        $query = http_build_query([
            'client_id' => $config['client_id'],
            'redirect'  => route('sso.bbos.callback'),
            'state'     => $state,
        ]);

        return redirect()->away($config['base_url'].'/sso/authorize?'.$query);
    }

    /**
     * Callback: bbos torna con `?ticket=...&state=...`. Verifichiamo lo
     * state, scambiamo il ticket server-to-server contro bbos, troviamo
     * l'utente locale per email e lo loggiamo. Niente auto-provisioning:
     * se l'email non esiste in holidays, l'accesso è negato.
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

        $data  = $response->json();
        $email = (string) ($data['email'] ?? '');
        if ($email === '') {
            return redirect()->route('login')->withErrors([
                'email' => 'Risposta SSO incompleta.',
            ]);
        }

        $user = User::where('email', $email)->where('active', true)->first();
        if (! $user) {
            return redirect()->route('login')->withErrors([
                'email' => 'Nessun account Holidays attivo per '.$email.'.',
            ]);
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
