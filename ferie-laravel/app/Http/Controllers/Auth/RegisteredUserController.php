<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\WelcomeNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'job_role'   => 'required|string|in:Designer,PM,Developer,Socio',
            'email'      => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password'   => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'first_name.required' => 'Inserisci il nome.',
            'last_name.required'  => 'Inserisci il cognome.',
            'job_role.required'   => 'Seleziona il ruolo.',
            'job_role.in'         => 'Ruolo non valido.',
            'email.required'      => 'Inserisci l\'email.',
            'email.unique'        => 'Email già registrata.',
            'password.required'   => 'Inserisci la password.',
            'password.confirmed'  => 'Le password non coincidono.',
        ]);

        $name = trim($request->first_name.' '.$request->last_name) ?: $request->email;

        $user = User::create([
            'name'       => $name,
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'job_role'   => $request->job_role,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'role'       => 'user',
            'active'     => true,
        ]);

        try {
            $user->notify(new WelcomeNotification($user, createdByAdmin: false));
        } catch (\Throwable $e) {
            logger()->error('WelcomeNotification failed: '.$e->getMessage());
        }

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
