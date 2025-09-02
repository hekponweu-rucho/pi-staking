@extends('emails.layout')

@section('title', 'Bonus de parrainage gagné')
@section('header-title', '💰 Bonus gagné !')
@section('header-subtitle', 'Votre filleul a investi, vous gagnez une commission')

@section('content')
<div class="greeting">
    Bonjour {{ $user->name }},
</div>

<div class="message-content">
    <strong>Félicitations !</strong> Votre filleul {{ $referred->username }} a effectué un investissement, ce qui vous fait gagner un bonus de parrainage.
</div>

<div style="text-align: center; margin: 30px 0;">
    <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; border-radius: 12px; display: inline-block; min-width: 300px;">
        <div style="font-size: 16px; opacity: 0.9; margin-bottom: 8px;">Bonus gagné</div>
        <div style="font-size: 36px; font-weight: bold;">{{ number_format($bonus, 4) }} π</div>
        <div style="font-size: 14px; opacity: 0.8; margin-top: 5px;">
            Niveau {{ $level }} ({{ $level == 1 ? '5%' : ($level == 2 ? '3%' : '1%') }})
        </div>
    </div>
</div>

<div class="info-grid">
    <div class="info-item">
        <div class="info-label">Filleul</div>
        <div class="info-value">{{ $referred->username }}</div>
    </div>
    <div class="info-item">
        <div class="info-label">Investissement</div>
        <div class="info-value">{{ number_format($investment_amount, 4) }} π</div>
    </div>
    <div class="info-item">
        <div class="info-label">Commission</div>
        <div class="info-value">{{ $level == 1 ? '5%' : ($level == 2 ? '3%' : '1%') }}</div>
    </div>
    <div class="info-item">
        <div class="info-label">Crédité à</div>
        <div class="info-value">{{ now()->format('d/m/Y H:i') }}</div>
    </div>
</div>

<div class="highlight-box" style="border-left-color: #48bb78; background-color: #c6f6d5;">
    <h3 style="color: #276749; margin-bottom: 15px;">💳 Bonus automatiquement crédité</h3>
    <p style="color: #276749; margin: 0;">
        Le bonus de <strong>{{ number_format($bonus, 4) }} π</strong> a été automatiquement ajouté à votre solde. 
        Vous pouvez l'utiliser immédiatement pour de nouveaux investissements ou le retirer.
    </p>
</div>

<div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
    <h4 style="color: #2d3748; margin-bottom: 10px;">🎯 Votre système de parrainage</h4>
    <div style="color: #4a5568;">
        <p><strong>Continuez à gagner :</strong> Chaque nouvel investissement de {{ $referred->username }} vous rapportera {{ $level == 1 ? '5%' : ($level == 2 ? '3%' : '1%') }} de commission.</p>
        <p><strong>Parrainez plus :</strong> Invitez d'autres amis avec votre code <strong>{{ $user->referral_code }}</strong> pour multiplier vos gains.</p>
    </div>
</div>

<div style="text-align: center; margin: 30px 0;">
    <a href="{{ config('app.frontend_url') }}/dashboard/referrals" class="button">Voir mes gains</a>
    <a href="{{ config('app.frontend_url') }}/dashboard/transactions" class="button" style="margin-left: 15px;">Historique des transactions</a>
</div>

<div class="success-notice">
    <strong>Merci d'être un ambassadeur Pi Staking !</strong> Votre réseau grandit et vos gains aussi. 
    Continuez à partager les opportunités avec vos proches.
</div>
@endsection