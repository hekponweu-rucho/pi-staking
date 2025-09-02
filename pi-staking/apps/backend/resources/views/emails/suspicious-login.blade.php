@extends('emails.layout')

@section('title', 'Connexion suspecte détectée')

@section('header-title', '🚨 Alerte de sécurité')
@section('header-subtitle', 'Connexion suspecte détectée sur votre compte')

@section('content')
    <div class="greeting">
        Bonjour {{ $user->name }},
    </div>
    
    <div class="message-content" style="color: #c53030; font-weight: 600;">
        <strong>Nous avons détecté une connexion suspecte sur votre compte Pi Staking.</strong>
    </div>
    
    <div class="message-content">
        Cette connexion présente des caractéristiques inhabituelles par rapport à vos habitudes de connexion. 
        Par mesure de sécurité, nous vous informons de cette activité.
    </div>
    
    <div class="highlight-box" style="border-left-color: #e53e3e; background-color: #fed7d7;">
        <h3 style="color: #c53030; margin-bottom: 15px;">🔍 Détails de la connexion suspecte :</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
            <div>
                <div class="info-label" style="color: #c53030;">Date et heure</div>
                <div class="info-value" style="color: #2d3748; font-weight: bold;">{{ $timestamp }}</div>
            </div>
            <div>
                <div class="info-label" style="color: #c53030;">Adresse IP</div>
                <div class="info-value" style="color: #2d3748; font-weight: bold;">{{ $ip }}</div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <div class="info-label" style="color: #c53030;">Localisation</div>
                <div class="info-value" style="color: #2d3748;">{{ $location }}</div>
            </div>
            <div>
                <div class="info-label" style="color: #c53030;">Appareil</div>
                <div class="info-value" style="color: #2d3748;">{{ $device }}</div>
            </div>
        </div>
    </div>
    
    <div class="message-content">
        <strong>Si cette connexion provient de vous :</strong>
        <ul style="margin: 15px 0; padding-left: 20px; color: #4a5568;">
            <li>Aucune action n'est nécessaire</li>
            <li>Cette alerte sera automatiquement marquée comme légitime</li>
        </ul>
        
        <strong style="color: #c53030;">Si cette connexion ne provient PAS de vous :</strong>
        <ul style="margin: 15px 0; padding-left: 20px; color: #c53030;">
            <li><strong>Changez votre mot de passe immédiatement</strong></li>
            <li>Activez l'authentification à deux facteurs</li>
            <li>Vérifiez vos transactions récentes</li>
            <li>Contactez notre support d'urgence</li>
        </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $action_url }}" class="button" style="margin-right: 15px;">Examiner la connexion</a>
        <a href="{{ url('/security/emergency') }}" class="button button-danger">Action d'urgence</a>
    </div>
    
    <div style="text-align: center; margin: 20px 0;">
        <a href="{{ url('/security/change-password') }}" class="button">Changer mon mot de passe</a>
    </div>
    
    <div class="security-notice">
        <strong>Rappel de sécurité :</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Ne partagez jamais vos identifiants avec personne</li>
            <li>Utilisez un mot de passe unique et complexe</li>
            <li>Activez l'authentification à deux facteurs</li>
            <li>Vérifiez régulièrement vos logs de sécurité</li>
        </ul>
    </div>
    
    <div class="message-content" style="font-size: 14px; color: #718096; text-align: center;">
        Cette alerte a été générée automatiquement par notre système de sécurité avancé.
        <br>
        En cas de doute, contactez immédiatement notre équipe support.
    </div>
@endsection