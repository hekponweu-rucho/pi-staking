@extends('emails.layout')

@section('title', 'Résumé hebdomadaire de sécurité')

@section('header-title', 'Résumé de sécurité')
@section('header-subtitle', 'Votre activité de la semaine du {{ $week_start }} au {{ $week_end }}')

@section('content')
    <div class="greeting">
        Bonjour {{ $user->name }},
    </div>
    
    <div class="message-content">
        Voici votre résumé de sécurité hebdomadaire pour votre compte Pi Staking. 
        Ce rapport vous aide à surveiller l'activité de votre compte et à maintenir un niveau de sécurité optimal.
    </div>
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
        <h2 style="margin-bottom: 10px; font-size: 24px;">📊 Semaine du {{ $week_start }} au {{ $week_end }}</h2>
        <p style="opacity: 0.9; font-size: 16px;">Résumé de votre activité de sécurité</p>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
        <div class="info-item" style="text-align: center; padding: 25px;">
            <div style="font-size: 36px; font-weight: bold; color: #48bb78; margin-bottom: 8px;">
                {{ $stats['logins'] }}
            </div>
            <div class="info-label" style="color: #2d3748;">Connexions réussies</div>
        </div>
        
        <div class="info-item" style="text-align: center; padding: 25px;">
            <div style="font-size: 36px; font-weight: bold; color: {{ $stats['failed_logins'] > 0 ? '#e53e3e' : '#48bb78' }}; margin-bottom: 8px;">
                {{ $stats['failed_logins'] }}
            </div>
            <div class="info-label" style="color: #2d3748;">Tentatives échouées</div>
        </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 30px 0;">
        <div class="info-item" style="text-align: center; padding: 20px;">
            <div style="font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 5px;">
                {{ $stats['withdrawals'] }}
            </div>
            <div class="info-label" style="font-size: 14px;">Retraits</div>
        </div>
        
        <div class="info-item" style="text-align: center; padding: 20px;">
            <div style="font-size: 24px; font-weight: bold; color: #f6ad55; margin-bottom: 5px;">
                {{ $stats['security_changes'] }}
            </div>
            <div class="info-label" style="font-size: 14px;">Modifications sécurité</div>
        </div>
        
        <div class="info-item" style="text-align: center; padding: 20px;">
            <div style="font-size: 24px; font-weight: bold; color: #9f7aea; margin-bottom: 5px;">
                {{ $stats['unique_ips'] }}
            </div>
            <div class="info-label" style="font-size: 14px;">IP distinctes</div>
        </div>
    </div>
    
    @if($stats['failed_logins'] > 0)
        <div style="background-color: #fed7d7; border-left: 4px solid #e53e3e; padding: 20px; margin: 25px 0; border-radius: 0 6px 6px 0;">
            <h4 style="color: #c53030; margin-bottom: 10px;">⚠️ Attention : Tentatives de connexion échouées</h4>
            <p style="color: #c53030;">
                Nous avons détecté {{ $stats['failed_logins'] }} tentative(s) de connexion échouée(s) cette semaine. 
                Si ces tentatives ne proviennent pas de vous, nous recommandons de :
            </p>
            <ul style="color: #c53030; margin: 10px 0; padding-left: 20px;">
                <li>Changer votre mot de passe</li>
                <li>Activer l'authentification à deux facteurs</li>
                <li>Vérifier vos paramètres de sécurité</li>
            </ul>
        </div>
    @else
        <div class="success-notice">
            <strong>✅ Excellente sécurité :</strong> Aucune tentative de connexion échouée cette semaine. 
            Votre compte reste bien protégé !
        </div>
    @endif
    
    @if($stats['unique_ips'] > 3)
        <div style="background-color: #fef5e7; border-left: 4px solid #f6ad55; padding: 20px; margin: 25px 0; border-radius: 0 6px 6px 0;">
            <h4 style="color: #c05621; margin-bottom: 10px;">📍 Connexions depuis plusieurs localisations</h4>
            <p style="color: #c05621;">
                Vous vous êtes connecté depuis {{ $stats['unique_ips'] }} adresses IP différentes cette semaine. 
                Si vous voyagez ou utilisez plusieurs réseaux, c'est normal. 
                Sinon, vérifiez l'activité de votre compte.
            </p>
        </div>
    @endif
    
    <div class="highlight-box">
        <h3 style="color: #2d3748; margin-bottom: 15px;">🛡️ Recommandations de sécurité :</h3>
        
        <div style="display: grid; gap: 15px;">
            <div style="display: flex; align-items: center; padding: 10px 0;">
                <div style="margin-right: 15px; font-size: 20px;">
                    {{ $user->two_factor_enabled ? '✅' : '❌' }}
                </div>
                <div>
                    <div style="font-weight: bold; color: {{ $user->two_factor_enabled ? '#276749' : '#c53030' }};">
                        Authentification à deux facteurs
                    </div>
                    <div style="font-size: 14px; color: #4a5568;">
                        {{ $user->two_factor_enabled ? 'Activée - Votre compte est bien protégé' : 'Non activée - Activez-la pour plus de sécurité' }}
                    </div>
                </div>
            </div>
            
            <div style="display: flex; align-items: center; padding: 10px 0;">
                <div style="margin-right: 15px; font-size: 20px;">
                    {{ $user->email_verified_at ? '✅' : '❌' }}
                </div>
                <div>
                    <div style="font-weight: bold; color: {{ $user->email_verified_at ? '#276749' : '#c53030' }};">
                        Email vérifié
                    </div>
                    <div style="font-size: 14px; color: #4a5568;">
                        {{ $user->email_verified_at ? 'Vérifié - Vous recevrez nos alertes de sécurité' : 'Non vérifié - Vérifiez votre email' }}
                    </div>
                </div>
            </div>
            
            <div style="display: flex; align-items: center; padding: 10px 0;">
                <div style="margin-right: 15px; font-size: 20px;">
                    {{ now()->subDays(30)->lt($user->password_changed_at ?? $user->created_at) ? '✅' : '⚠️' }}
                </div>
                <div>
                    <div style="font-weight: bold; color: {{ now()->subDays(30)->lt($user->password_changed_at ?? $user->created_at) ? '#276749' : '#f6ad55' }};">
                        Mot de passe récent
                    </div>
                    <div style="font-size: 14px; color: #4a5568;">
                        {{ now()->subDays(30)->lt($user->password_changed_at ?? $user->created_at) ? 'Changé récemment' : 'Changé il y a plus de 30 jours' }}
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ url('/security/settings') }}" class="button">Améliorer ma sécurité</a>
        <a href="{{ url('/security/activity') }}" class="button" style="margin-left: 15px;">Voir l'activité détaillée</a>
    </div>
    
    <div class="message-content" style="font-size: 14px; color: #718096; text-align: center; background-color: #f7fafc; padding: 20px; border-radius: 8px;">
        <strong>💡 Le saviez-vous ?</strong>
        <br>
        Les comptes avec l'authentification à deux facteurs activée sont 99,9% moins susceptibles d'être compromis. 
        <br>
        <a href="{{ url('/security/2fa/setup') }}" style="color: #667eea;">Activez la 2FA maintenant →</a>
    </div>
@endsection