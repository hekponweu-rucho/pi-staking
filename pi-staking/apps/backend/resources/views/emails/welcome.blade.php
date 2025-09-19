@extends('emails.layout')

@section('title', 'Bienvenue !')

@section('header-title', 'Bienvenue sur Pi Staking')
@section('header-subtitle', 'Heureux de vous compter parmi nous')

@section('content')
    <div class="greeting">
        Bonjour {{ $user->first_name ?? $user->username ?? $user->name ?? 'et bienvenue' }},
    </div>

    <div class="message-content">
        Votre adresse email vient d'être vérifiée. Votre compte est maintenant prêt. Vous pouvez déposer des Pi, investir et suivre vos performances.
    </div>

    <div class="success-notice">
        Astuce: activez la 2FA dans le Centre de sécurité pour une protection maximale.
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $dashboardUrl }}" class="button">Accéder à mon tableau de bord</a>
    </div>
@endsection
