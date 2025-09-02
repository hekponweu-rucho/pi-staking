@extends('emails.layout')

@section('title', 'Confirmation de retrait important')

@section('header-title', 'Retrait important effectué')
@section('header-subtitle', 'Confirmation de votre transaction')

@section('content')
    <div class="greeting">
        Bonjour {{ $user->name }},
    </div>
    
    <div class="message-content">
        Nous vous confirmons qu'un retrait important a été effectué avec succès sur votre compte Pi Staking.
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; border-radius: 12px; display: inline-block; min-width: 300px;">
            <div style="font-size: 16px; opacity: 0.9; margin-bottom: 8px;">Montant retiré</div>
            <div style="font-size: 36px; font-weight: bold;">{{ number_format($amount, 4) }} π</div>
        </div>
    </div>
    
    <div class="highlight-box" style="border-left-color: #48bb78; background-color: #c6f6d5;">
        <h3 style="color: #276749; margin-bottom: 15px;">📋 Détails de la transaction :</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <div class="info-label" style="color: #276749;">Date et heure</div>
                <div class="info-value" style="color: #1a202c; font-weight: bold;">{{ $timestamp }}</div>
            </div>
            <div>
                <div class="info-label" style="color: #276749;">Adresse IP</div>
                <div class="info-value" style="color: #1a202c;">{{ $ip }}</div>
            </div>
        </div>
        
        <div style="margin-top: 20px;">
            <div class="info-label" style="color: #276749;">Statut</div>
            <div style="color: #276749; font-weight: bold; font-size: 16px;">
                ✅ Traité avec succès
            </div>
        </div>
    </div>
    
    <div class="message-content">
        <strong>Informations importantes :</strong>
        <ul style="margin: 15px 0; padding-left: 20px;">
            <li>Le retrait a été validé par notre système de sécurité</li>
            <li>Les fonds ont été transférés vers votre portefeuille</li>
            <li>Cette transaction est maintenant visible dans votre historique</li>
            <li>Un reçu détaillé est disponible dans votre espace client</li>
        </ul>
    </div>
    
    <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h4 style="color: #2d3748; margin-bottom: 10px;">🏦 Délais de traitement :</h4>
        <div style="color: #4a5568;">
            <p><strong>Blockchain Pi Network :</strong> 1-3 confirmations (environ 5-15 minutes)</p>
            <p><strong>Portefeuille externe :</strong> Selon le réseau, généralement sous 30 minutes</p>
            <p style="margin-top: 10px; font-size: 14px; color: #718096;">
                Les délais peuvent varier selon l'activité du réseau Pi Network.
            </p>
        </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ url('/dashboard/transactions') }}" class="button">Voir mes transactions</a>
        <a href="{{ url('/dashboard/withdrawals') }}" class="button" style="margin-left: 15px;">Historique des retraits</a>
    </div>
    
    <div class="success-notice">
        <strong>Transaction sécurisée :</strong> Ce retrait a été validé par notre système de sécurité multicouche 
        et toutes les vérifications nécessaires ont été effectuées.
    </div>
    
    <div class="message-content" style="font-size: 14px; color: #718096; text-align: center; margin-top: 30px;">
        Si vous n'avez pas demandé ce retrait ou si vous avez des questions, contactez immédiatement notre support.
        <br><br>
        <a href="{{ url('/support') }}" style="color: #667eea;">Contacter le support →</a>
    </div>
@endsection