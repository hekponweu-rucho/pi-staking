@extends('emails.layout')

@section('title', 'Notification de sécurité')

@section('header-title', 'Notification de sécurité')
@section('header-subtitle', 'Activité importante sur votre compte')

@section('content')
    <div class="greeting">
        Bonjour {{ $user->name }},
    </div>
    
    <div class="message-content">
        Nous vous informons d'une activité importante sur votre compte Pi Staking qui nécessite votre attention.
    </div>
    
    <div class="highlight-box">
        <h3 style="color: #2d3748; margin-bottom: 10px;">Détails de la notification :</h3>
        <p style="color: #4a5568;">{{ $message ?? 'Activité de sécurité détectée sur votre compte.' }}</p>
        
        @if(isset($details))
            <div style="margin-top: 15px;">
                @foreach($details as $key => $value)
                    <div style="margin: 5px 0;">
                        <strong>{{ ucfirst($key) }}:</strong> {{ $value }}
                    </div>
                @endforeach
            </div>
        @endif
    </div>
    
    <div class="info-grid">
        <div class="info-item">
            <div class="info-label">Date et heure</div>
            <div class="info-value">{{ now()->format('d/m/Y à H:i:s') }}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Adresse IP</div>
            <div class="info-value">{{ request()->ip() ?? 'Non disponible' }}</div>
        </div>
    </div>
    
    <div class="message-content">
        Si cette activité vous semble suspecte ou si vous n'êtes pas à l'origine de cette action, nous vous recommandons de :
        <ul style="margin: 15px 0; padding-left: 20px;">
            <li>Changer votre mot de passe immédiatement</li>
            <li>Vérifier vos paramètres de sécurité</li>
            <li>Activer l'authentification à deux facteurs si ce n'est pas déjà fait</li>
            <li>Contacter notre support si nécessaire</li>
        </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ url('/security') }}" class="button">Vérifier la sécurité</a>
    </div>
    
    <div class="security-notice">
        <strong>Important :</strong> Pi Staking ne vous demandera jamais vos identifiants par email. 
        Si vous recevez des emails suspects, ne cliquez sur aucun lien et contactez-nous directement.
    </div>
@endsection