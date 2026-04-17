<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Notifications\WelcomeNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class UsersController extends Controller
{
    private const IMPERSONATOR_SESSION_KEY = 'impersonator_admin_id';

    public function index(Request $request): Response
    {
        $year = (int) ($request->get('year') ?? now()->year);

        $approvedUsedDaysByUser = LeaveRequest::sumDeductibleApprovedDaysByUserForYear($year);

        $users = User::where('active', true)
            ->where('role', '!=', 'admin')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn (User $u) => $this->mapUser($u, $year, $approvedUsedDaysByUser));

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'year' => $year,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'firstName' => 'required|string|max:255',
            'lastName' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'jobRole' => 'required|string|in:Designer,PM,Developer,Socio',
        ], [
            'firstName.required' => 'Inserisci il nome.',
            'lastName.required' => 'Inserisci il cognome.',
            'email.required' => 'Inserisci l\'email.',
            'email.email' => 'Email non valida.',
            'email.unique' => 'Email già in uso.',
            'password.required' => 'Inserisci la password.',
            'password.confirmed' => 'Le password non coincidono.',
            'jobRole.required' => 'Seleziona il ruolo.',
            'jobRole.in' => 'Ruolo non valido.',
        ]);

        $name = trim($validated['firstName'].' '.$validated['lastName']) ?: $validated['email'];

        $user = User::create([
            'name' => $name,
            'first_name' => $validated['firstName'],
            'last_name' => $validated['lastName'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'user',
            'job_role' => $validated['jobRole'],
            'active' => true,
        ]);

        try {
            $user->notify(new WelcomeNotification($user, createdByAdmin: true));
        } catch (\Throwable $e) {
            logger()->error('WelcomeNotification failed: '.$e->getMessage());
        }

        return back()->with('status', 'Utente creato.');
    }

    public function updateBalance(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'allocated_days' => 'required|integer|min:0|max:365',
            'year' => 'required|integer|min:2020|max:2100',
        ], [
            'allocated_days.required' => 'Inserisci i giorni assegnati.',
            'allocated_days.integer' => 'Il valore deve essere un numero intero.',
            'allocated_days.min' => 'Il valore non può essere negativo.',
            'allocated_days.max' => 'Massimo 365 giorni.',
        ]);

        LeaveBalance::updateOrCreate(
            [
                'user_id' => $user->id,
                'year' => $validated['year'],
            ],
            ['allocated_days' => $validated['allocated_days']]
        );

        return back()->with('status', 'Budget aggiornato.');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->role === 'admin') {
            return back()->withErrors(['delete' => 'Non è possibile eliminare un admin.']);
        }

        $user->delete();

        return back()->with('status', 'Utente eliminato.');
    }

    public function impersonate(Request $request, User $user): RedirectResponse
    {
        $admin = $request->user();
        if (! $admin || ! $admin->isAdmin()) {
            abort(403);
        }

        if ($user->isAdmin()) {
            return back()->withErrors(['impersonate' => 'Non puoi impersonare un amministratore.']);
        }

        $request->session()->put(self::IMPERSONATOR_SESSION_KEY, (int) $admin->id);
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard');
    }

    public function stopImpersonation(Request $request): RedirectResponse
    {
        $impersonatorId = (int) $request->session()->get(self::IMPERSONATOR_SESSION_KEY, 0);
        if ($impersonatorId < 1) {
            return back();
        }

        $admin = User::find($impersonatorId);
        $request->session()->forget(self::IMPERSONATOR_SESSION_KEY);

        if (! $admin || ! $admin->isAdmin()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')
                ->withErrors(['impersonate' => 'Impossibile ripristinare la sessione admin.']);
        }

        Auth::login($admin);
        $request->session()->regenerate();

        return redirect()->route('admin.users.index')
            ->with('status', 'Impersonazione terminata. Sei tornato come admin.');
    }

    /**
     * @param  Collection<int|string, int|float|string>  $approvedUsedDaysByUser  user_id => somma giorni lavorativi da richieste APPROVED che scalano il budget (stessa logica dell'approvazione admin).
     */
    private function mapUser(User $u, int $year, $approvedUsedDaysByUser): array
    {
        $balance = LeaveBalance::where('user_id', $u->id)
            ->where('year', $year)
            ->first();

        $allocated = (int) ($balance?->allocated_days ?? 0);
        $used = (int) $approvedUsedDaysByUser->get($u->id, 0);

        return [
            'id' => (string) $u->id,
            'firstName' => $u->first_name ?? '',
            'lastName' => $u->last_name ?? '',
            'email' => $u->email ?? '',
            'role' => $u->role ?? 'user',
            'jobRole' => $u->job_role ?? '',
            'allocatedDays' => $allocated,
            'usedDays' => $used,
            'remaining' => max(0, $allocated - $used),
        ];
    }
}
