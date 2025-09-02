@extends('emails.layout')

@section('title', 'Code de vérification pour retrait')

@section('header-title', 'Code de vérification')
@section('header-subtitle', 'Confirmez votre demande de retrait')

@section('content')
    <div class="greeting">
        Bonjour {{ $user->name }},
    </div>
    
    <div class="message-content">
        Nous avons reçu une demande de retrait sur votre compte Pi Staking. Pour des raisons de sécurité, 
        veuillez confirmer cette transaction en utilisant le code de vérification ci-dessous.
    </div>
    
    <div class="info-grid">
        <div class="info-item">
            <div class="info-label">Montant du retrait</div>
            <div class="info-value" style="font-size: 20px; font-weight: bold; color: #667eea;">{{ number_format($amount, 4) }} π</div>
        </div>
        <div class="info-item">
            <div class="info-label">Expire dans</div>
            <div class="info-value" style="color: #e53e3e;">{{ $expires_in }} minutes</div>
        </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <div class="code-box">
            {{ $code }}
        </div>
        <p style="color: #718096; font-size: 14px; margin-top: 10px;">
            Saisissez ce code dans votre interface Pi Staking
        </p>
    </div>
    
    <div class="highlight-box">
        <h3 style="color: #2d3748; margin-bottom: 10px;">Informations de la demande :</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
                <strong>Date :</strong> {{ $timestamp }}
            </div>
            <div>
                <strong>Adresse IP :</strong> {{ $ip }}
            </div>
        </div>
    </div>
    
    <div class="message-content">
        <strong>Ce code est valable pendant {{ $expires_in }} minutes seulement.</strong> 
        Si vous n'avez pas demandé ce retrait, ignorez cet email et contactez notre support immédiatement.
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ url('/dashboard/withdrawals') }}" class="button">Accéder à mes retraits</a>
        <a href="{{ url('/support/urgent') }}" class="button button-danger" style="margin-left: 15px;">Signaler un problème</a>
    </div>
    
    <div class="security-notice">
        <strong>Sécurité :</strong> Ne partagez jamais ce code avec quelqu'un d'autre. 
        L'équipe Pi Staking ne vous demandera jamais vos codes de vérification.
    </div>
@endsection