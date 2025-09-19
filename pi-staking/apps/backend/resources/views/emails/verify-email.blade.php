@extends('emails.layout')

@section('title', 'Vérifiez votre email')

@section('header-title', 'Vérification de votre email')
@section('header-subtitle', 'Activez votre compte Pi Staking')

@section('content')
    <div class="greeting">
        Bonjour {{ $user->username ?? $user->name ?? 'Cher utilisateur' }},
    </div>

    <div class="message-content">
        Merci de vous être inscrit sur Pi Staking. Pour sécuriser votre compte, veuillez confirmer votre adresse email.
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $verifyUrl }}" class="button">Vérifier mon email</a>
        <p style="color: #718096; font-size: 14px; margin-top: 10px;">Ce lien expire dans {{ $expires_in_hours }} heures.</p>
    </div>

    <div class="highlight-box">
        <h3 style="color: #2d3748; margin-bottom: 10px;">Si le bouton ne fonctionne pas</h3>
        <p style="word-break: break-all; color: #4a5568;">
            Copiez-collez ce lien dans votre navigateur :<br>
            <a href="{{ $verifyUrl }}" style="color: #667eea; text-decoration: underline;">{{ $verifyUrl }}</a>
        </p>
    </div>
@endsection
