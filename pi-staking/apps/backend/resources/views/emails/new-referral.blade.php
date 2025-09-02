@extends('emails.layout')

@section('title', 'Nouveau filleul')
@section('header-title', '🎉 Nouveau filleul !')
@section('header-subtitle', 'Quelqu\'un s\'est inscrit avec votre code')

@section('content')
<div class="greeting">
    Bonjour {{ $user->name }},
</div>

<div class="message-content">
    Excellente nouvelle ! Un nouvel utilisateur s'est inscrit sur Pi Staking en utilisant votre code de parrainage.
</div>

<div class="highlight-box" style="border-left-color: #48bb78; background-color: #c6f6d5;">
    <h3 style="color: #276749; margin-bottom: 15px;">✨ Nouveau filleul</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
            <strong>Nom d'utilisateur :</strong> {{ $referred->username }}
        </div>
        <div>
            <strong>Date d'inscription :</strong> {{ $referred->created_at->format('d/m/Y à H:i') }}
        </div>
    </div>
    <div style="margin-top: 15px;">
        <strong>Votre code utilisé :</strong> 
        <span style="background: #f0f9ff; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: bold;">
            {{ $user->referral_code }}
        </span>
    </div>
</div>

<div class="message-content">
    <strong>Prochaine étape :</strong> Votre filleul doit effectuer un investissement minimum de <strong>50 π</strong> pour activer votre bonus de parrainage.
</div>

<div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
    <h4 style="color: #2d3748; margin-bottom: 10px;">💰 Vos bonus de parrainage</h4>
    <ul style="color: #4a5568; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li><strong>Niveau 1 (Direct) :</strong> 5% de l'investissement</li>
        <li><strong>Niveau 2 :</strong> 3% de l'investissement</li>
        <li><strong>Niveau 3 :</strong> 1% de l'investissement</li>
    </ul>
</div>

<div style="text-align: center; margin: 30px 0;">
    <a href="{{ config('app.frontend_url') }}/dashboard/referrals" class="button">Voir mes filleuls</a>
</div>

<div class="success-notice">
    <strong>Continuez à partager :</strong> Plus vous parrainez d'utilisateurs actifs, plus vos gains augmentent ! 
    Partagez votre code {{ $user->referral_code }} avec vos amis.
</div>
@endsection