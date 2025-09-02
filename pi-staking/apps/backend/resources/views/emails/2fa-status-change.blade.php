@extends('emails.layout')

@section('title', 'Authentification 2FA {{ $action }}')

@section('header-title', 'Authentification 2FA {{ $action }}')
@section('header-subtitle', 'Modification de votre sécurité d\'authentification')

@section('content')
    <div class="greeting">
        Bonjour {{ $user->name }},
    </div>
    
    @if($enabled)
        <div class="message-content">
            <strong style="color: #276749;">🎉 Félicitations !</strong> Vous avez activé avec succès l'authentification à deux facteurs (2FA) sur votre compte Pi Staking.
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; border-radius: 12px; display: inline-block;">
                <div style="font-size: 48px; margin-bottom: 10px;">🔐</div>
                <div style="font-size: 20px; font-weight: bold;">Authentification 2FA activée</div>
                <div style="font-size: 16px; opacity: 0.9; margin-top: 5px;">Votre compte est maintenant ultra-sécurisé</div>
            </div>
        </div>
        
        <div class="success-notice">
            <strong>Sécurité renforcée :</strong> Votre compte bénéficie maintenant d'une protection 99,9% plus efficace contre les accès non autorisés.
        </div>
        
        <div class="highlight-box" style="border-left-color: #48bb78; background-color: #c6f6d5;">
            <h3 style="color: #276749; margin-bottom: 15px;">✅ Ce que cela signifie pour vous :</h3>
            
            <ul style="color: #276749; line-height: 1.8;">
                <li><strong>Connexions sécurisées :</strong> Vous devrez utiliser votre authenticator à chaque connexion</li>
                <li><strong>Protection des retraits :</strong> Validation 2FA requise pour toutes les transactions importantes</li>
                <li><strong>Codes de récupération :</strong> Conservez précieusement vos codes de sauvegarde</li>
                <li><strong>Alertes renforcées :</strong> Notifications en cas de tentative de désactivation</li>
            </ul>
        </div>
        
        <div style="background-color: #edf2f7; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #2d3748; margin-bottom: 15px;">📱 Prochaines étapes :</h4>
            <ol style="color: #4a5568; line-height: 1.8; padding-left: 20px;">
                <li>Testez votre authentificateur en vous déconnectant et reconnectant</li>
                <li>Sauvegardez vos codes de récupération dans un endroit sûr</li>
                <li>Informez-vous sur les bonnes pratiques 2FA</li>
                <li>Activez les notifications de sécurité si ce n'est pas déjà fait</li>
            </ol>
        </div>
        
    @else
        <div class="message-content" style="color: #c53030;">
            <strong>⚠️ Important :</strong> L'authentification à deux facteurs (2FA) a été désactivée sur votre compte Pi Staking.
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <div style="background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); color: white; padding: 30px; border-radius: 12px; display: inline-block;">
                <div style="font-size: 48px; margin-bottom: 10px;">🔓</div>
                <div style="font-size: 20px; font-weight: bold;">Authentification 2FA désactivée</div>
                <div style="font-size: 16px; opacity: 0.9; margin-top: 5px;">Votre compte est moins sécurisé</div>
            </div>
        </div>
        
        <div style="background-color: #fed7d7; border: 1px solid #feb2b2; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <h4 style="color: #c53030; margin-bottom: 10px;">🚨 Risques de sécurité :</h4>
            <ul style="color: #c53030; line-height: 1.8;">
                <li>Votre compte est plus vulnérable aux accès non autorisés</li>
                <li>Les pirates peuvent plus facilement compromettre votre compte</li>
                <li>Vos fonds sont moins protégés qu'auparavant</li>
                <li>Vous ne bénéficiez plus de la double vérification</li>
            </ul>
        </div>
        
        <div class="highlight-box" style="border-left-color: #e53e3e; background-color: #fed7d7;">
            <h3 style="color: #c53030; margin-bottom: 15px;">🛡️ Action recommandée :</h3>
            
            <p style="color: #c53030; font-weight: 600; margin-bottom: 15px;">
                Nous vous recommandons fortement de réactiver l'authentification 2FA immédiatement pour protéger votre compte.
            </p>
            
            <div style="text-align: center; margin: 20px 0;">
                <a href="{{ url('/security/2fa/setup') }}" class="button" style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);">
                    Réactiver la 2FA maintenant
                </a>
            </div>
        </div>
        
    @endif
    
    <div class="info-grid">
        <div class="info-item">
            <div class="info-label">Date et heure</div>
            <div class="info-value">{{ $timestamp }}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Adresse IP</div>
            <div class="info-value">{{ $ip }}</div>
        </div>
    </div>
    
    <div class="message-content">
        <strong>Si vous n'avez pas {{ $enabled ? 'activé' : 'désactivé' }} la 2FA :</strong>
    </div>
    
    <div style="background-color: #fed7d7; border: 1px solid #feb2b2; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="color: #c53030; font-weight: 600; margin-bottom: 10px;">🚨 Compte potentiellement compromis</p>
        <ul style="color: #c53030; padding-left: 20px;">
            <li><strong>Changez immédiatement votre mot de passe</strong></li>
            <li>Vérifiez toutes vos transactions récentes</li>
            <li>Activez la 2FA si elle a été désactivée</li>
            <li>Contactez notre support d'urgence</li>
            <li>Examinez vos logs de sécurité</li>
        </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ url('/security/settings') }}" class="button">Vérifier ma sécurité</a>
        @if(!$enabled)
            <a href="{{ url('/security/2fa/setup') }}" class="button" style="margin-left: 15px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);">Réactiver 2FA</a>
        @endif
    </div>
    
    <div style="text-align: center; margin: 20px 0;">
        <a href="{{ url('/support/urgent') }}" class="button button-danger">Signaler un problème</a>
    </div>
    
    @if($enabled)
        <div class="message-content" style="font-size: 14px; color: #718096; text-align: center; background-color: #f7fafc; padding: 20px; border-radius: 8px;">
            <strong>💡 Conseils de sécurité :</strong>
            <br>
            • Utilisez une app authentificateur réputée (Google Authenticator, Authy, Microsoft Authenticator)
            <br>
            • Ne partagez jamais vos codes 2FA avec personne
            <br>
            • Sauvegardez vos codes de récupération hors ligne
            <br>
            • Testez régulièrement votre configuration 2FA
        </div>
    @else
        <div class="message-content" style="font-size: 14px; color: #718096; text-align: center; background-color: #f7fafc; padding: 20px; border-radius: 8px;">
            <strong>⚠️ Rappel de sécurité :</strong>
            <br>
            Sans la 2FA, votre mot de passe est la seule protection de votre compte. 
            <br>
            Assurez-vous qu'il soit unique, complexe et jamais partagé.
        </div>
    @endif
@endsection