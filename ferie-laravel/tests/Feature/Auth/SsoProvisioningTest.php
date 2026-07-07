<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Provisioning JIT via SSO bbos: bbos è la fonte di verità degli utenti.
 * Il callback crea/aggiorna l'utente locale dai dati dello scambio ticket.
 */
class SsoProvisioningTest extends TestCase
{
    use RefreshDatabase;

    private function configureSso(): void
    {
        config([
            'sso.bbos.base_url'      => 'https://bbos.test',
            'sso.bbos.client_id'     => 'holidays',
            'sso.bbos.shared_secret' => 'shhh-secret',
            'sso.bbos.http_timeout'  => 10,
        ]);
    }

    private function fakeExchange(array $payload): void
    {
        Http::fake([
            'https://bbos.test/api/sso/exchange' => Http::response($payload, 200),
        ]);
    }

    /** Colpisce il callback con state valido in sessione e un ticket. */
    private function hitCallback(string $state = 'state-123', string $ticket = 'ticket-abc')
    {
        return $this
            ->withSession(['sso.bbos.state' => $state])
            ->get(route('sso.bbos.callback', ['ticket' => $ticket, 'state' => $state]));
    }

    public function test_new_user_is_provisioned_from_bbos(): void
    {
        $this->configureSso();
        $this->fakeExchange([
            'id'        => 42,
            'email'     => 'mario.rossi@bitboss.it',
            'name'      => 'Mario',
            'last_name' => 'Rossi',
            'is_active' => true,
            'is_admin'  => false,
        ]);

        $response = $this->hitCallback();

        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertAuthenticated();

        $user = User::where('email', 'mario.rossi@bitboss.it')->firstOrFail();
        $this->assertSame(42, (int) $user->bbos_id);
        $this->assertSame('Mario', $user->first_name);
        $this->assertSame('Rossi', $user->last_name);
        $this->assertSame('user', $user->role);
        $this->assertTrue((bool) $user->active);
        $this->assertNull($user->job_role); // job_role resta locale
    }

    public function test_admin_role_is_mapped_from_bbos(): void
    {
        $this->configureSso();
        $this->fakeExchange([
            'id' => 7, 'email' => 'boss@bitboss.it', 'name' => 'Big',
            'last_name' => 'Boss', 'is_active' => true, 'is_admin' => true,
        ]);

        $this->hitCallback();

        $this->assertSame('admin', User::where('email', 'boss@bitboss.it')->value('role'));
    }

    public function test_existing_user_is_relinked_by_email_and_job_role_preserved(): void
    {
        $this->configureSso();

        $existing = User::create([
            'first_name' => 'Vecchio',
            'last_name'  => 'Nome',
            'email'      => 'luca@bitboss.it',
            'password'   => bcrypt('secret'),
            'job_role'   => 'Developer',
        ]);
        $existing->role = 'user';
        $existing->active = true;
        $existing->save();
        $this->assertNull($existing->bbos_id);

        $this->fakeExchange([
            'id' => 99, 'email' => 'luca@bitboss.it', 'name' => 'Luca',
            'last_name' => 'Bianchi', 'is_active' => true, 'is_admin' => false,
        ]);

        $this->hitCallback();

        $existing->refresh();
        $this->assertSame(99, (int) $existing->bbos_id);         // backfill
        $this->assertSame('Luca', $existing->first_name);         // aggiornato da bbos
        $this->assertSame('Bianchi', $existing->last_name);
        $this->assertSame('Developer', $existing->job_role);      // preservato
        $this->assertSame(1, User::where('email', 'luca@bitboss.it')->count()); // no duplicati
    }

    public function test_inactive_bbos_user_is_rejected(): void
    {
        $this->configureSso();
        $this->fakeExchange([
            'id' => 5, 'email' => 'disattivato@bitboss.it', 'name' => 'Dis',
            'last_name' => 'Attivato', 'is_active' => false, 'is_admin' => false,
        ]);

        $response = $this->hitCallback();

        $response->assertRedirect(route('login'));
        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'disattivato@bitboss.it']);
    }

    public function test_callback_lands_on_safe_next_deep_link(): void
    {
        $this->configureSso();
        $this->fakeExchange([
            'id' => 3, 'email' => 'deep@bitboss.it', 'name' => 'Deep', 'last_name' => 'Link',
            'is_active' => true, 'is_admin' => false,
        ]);

        $response = $this
            ->withSession([
                'sso.bbos.state' => 'state-123',
                'sso.bbos.next'  => '/requests?create=1',
            ])
            ->get(route('sso.bbos.callback', ['ticket' => 'ticket-abc', 'state' => 'state-123']));

        $response->assertRedirect('/requests?create=1');
        $this->assertAuthenticated();
    }

    public function test_redirect_stores_only_safe_internal_next(): void
    {
        $this->configureSso();

        // Path interno ammesso.
        $this->get(route('sso.bbos.redirect', ['next' => '/requests?create=1']))
            ->assertSessionHas('sso.bbos.next', '/requests?create=1');

        // URL assoluto e protocol-relative scartati (open-redirect).
        $this->get(route('sso.bbos.redirect', ['next' => 'https://evil.example/steal']))
            ->assertSessionMissing('sso.bbos.next');

        $this->get(route('sso.bbos.redirect', ['next' => '//evil.example']))
            ->assertSessionMissing('sso.bbos.next');
    }

    public function test_redirect_goes_through_bbos_even_when_already_authenticated(): void
    {
        $this->configureSso();
        $user = User::factory()->create(['role' => 'user']);

        // Anche se già loggato su Holidays, si passa SEMPRE da bbos (fonte di
        // verità), non si va dritti al deep-link con la sessione locale.
        $response = $this->actingAs($user)
            ->get(route('sso.bbos.redirect', ['next' => '/requests?create=1']));

        $response->assertRedirectContains('bbos.test/sso/authorize');
        $response->assertSessionHas('sso.bbos.next', '/requests?create=1');
    }

    public function test_callback_switches_identity_to_bbos_user(): void
    {
        $this->configureSso();
        $this->fakeExchange([
            'id' => 77, 'email' => 'bianchi@bitboss.it', 'name' => 'Mario',
            'last_name' => 'Bianchi', 'is_active' => true, 'is_admin' => false,
        ]);

        // Rossi è già loggato su Holidays; da bbos però l'identità è Bianchi.
        $rossi = User::factory()->create(['email' => 'rossi@bitboss.it', 'role' => 'user']);

        $response = $this->actingAs($rossi)
            ->withSession(['sso.bbos.state' => 'st', 'sso.bbos.next' => '/requests?create=1'])
            ->get(route('sso.bbos.callback', ['ticket' => 'tk', 'state' => 'st']));

        $response->assertRedirect('/requests?create=1');
        // Ora sei Bianchi, non più Rossi.
        $bianchi = User::where('email', 'bianchi@bitboss.it')->firstOrFail();
        $this->assertAuthenticatedAs($bianchi);
    }
}
