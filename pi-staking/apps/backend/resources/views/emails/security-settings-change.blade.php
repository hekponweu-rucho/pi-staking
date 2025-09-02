@extends('emails.layout')

@section('title', 'Modification des paramètres de sécurité')

@section('header-title', 'Paramètres de sécurité modifiés')
@section('header-subtitle', 'Mise à jour de votre configuration de sécurité')

@section('content')
    <div class="greeting">
        Bonjour {{ $user->name }},
    </div>
    
    <div class="message-content">
        Nous vous informons qu'une modification a été apportée à vos paramètres de sécurité sur votre compte Pi Staking.
    </div>
    
    <div class="highlight-box" style="border-left-color: #f6ad55; background-color: #fffaf0;">
        <h3 style="color: #c05621; margin-bottom: 15px;">🔧 Modification effectuée :</h3>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #fed7aa;">
            <div style="color: #c05621; font-weight: bold; font-size: 16px; margin-bottom: 10px;">
                {{ $change }}
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                <div>
                    <div class="info-label" style="color: #c05621;">Date et heure</div>
                    <div class="info-value" style="color: #2d3748;">{{ $timestamp }}</div>
                </div>
                <div>
                    <div class="info-label" style="color: #c05621;">Adresse IP</div>
                    <div class="info-value" style="color: #2d3748;">{{ $ip }}</div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="message-content">
        Cette modification améliore la sécurité de votre compte. Voici ce que cela signifie pour vous :
    </div>
    
    <div style="background-color: #f7fafc; padding: 25px; border-radius: 8px; margin: 25px 0;">
        @if(str_contains(strtolower($change), 'mot de passe'))
            <h4 style="color: #2d3748; margin-bottom: 15px;">🔑 Changement de mot de passe :</h4>
            <ul style="color: #4a5568; line-height: 1.8;">
                <li>Votre nouveau mot de passe est maintenant actif</li>
                <li>Toutes les sessions existantes ont été fermées</li>
                <li>Vous devrez vous reconnecter sur tous vos appareils</li>
                <li>Cette modification renforce la sécurité de votre compte</li>
            </ul>
        @elseif(str_contains(strtolower($change), '2fa') || str_contains(strtolower($change), 'authentification'))
            <h4 style="color: #2d3748; margin-bottom: 15px;">🔐 Authentification à deux facteurs :</h4>
            <ul style="color: #4a5568; line-height: 1.8;">
                <li>Votre configuration 2FA a été mise à jour</li>
                <li>Cette couche de sécurité supplémentaire protège votre compte</li>
                <li>Vous devrez utiliser votre authenticator lors des prochaines connexions</li>
                <li>En cas de perte d'accès, utilisez vos codes de récupération</li>
            </ul>
        @elseif(str_contains(strtolower($change), 'email'))
            <h4 style="color: #2d3748; margin-bottom: 15px;">📧 Modification d'adresse email :</h4>
            <ul style="color: #4a5568; line-height: 1.8;">
                <li>Votre nouvelle adresse email est maintenant active</li>
                <li>Une vérification a été effectuée pour confirmer l'adresse</li>
                <li>Toutes les notifications seront envoyées à la nouvelle adresse</li>
                <li>L'ancienne adresse n'aura plus accès au compte</li>
            </ul>
        @else
            <h4 style="color: #2d3748; margin-bottom: 15px;">⚙️ Paramètre de sécurité modifié :</h4>
            <ul style="color: #4a5568; line-height: 1.8;">
                <li>La modification a été appliquée avec succès</li>
                <li>Votre niveau de sécurité a été mis à jour</li>
                <li>Cette modification prend effet immédiatement</li>
                <li>Vous pouvez vérifier les changements dans vos paramètres</li>
            </ul>
        @endif
    </div>
    
    <div class="message-content">
        <strong>Si vous n'avez pas effectué cette modification :</strong>
        <div style="background-color: #fed7d7; border: 1px solid #feb2b2; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="color: #c53030; font-weight: 600; margin-bottom: 10px;">⚠️ Action immédiate requise</p>
            <ul style="color: #c53030; padding-left: 20px;">
                <li>Changez immédiatement votre mot de passe</li>
                <li>Vérifiez tous vos paramètres de sécurité</li>
                <li>Contactez notre support d'urgence</li>
                <li>Examinez votre historique d'activité</li>
            </ul>
        </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ url('/security/settings') }}" class="button">Vérifier mes paramètres</a>
        <a href="{{ url('/security/activity') }}" class="button" style="margin-left: 15px;">Voir l'activité</a>
    </div>
    
    <div style="text-align: center; margin: 20px 0;">
        <a href="{{ url('/support/urgent') }}" class="button button-danger">Signaler un problème</a>
    </div>
    
    <div class="success-notice">
        <strong>Sécurité renforcée :</strong> Grâce à cette modification, votre compte Pi Staking bénéficie 
        d'un niveau de sécurité encore plus élevé. Nous recommandons de vérifier régulièrement vos paramètres.
    </div>
    
    <div class="message-content" style="font-size: 14px; color: #718096; text-align: center; margin-top: 30px;">
        Cette notification a été générée automatiquement pour votre sécurité.
        <br>
        Conservez cet email pour vos archives.
    </div>
@endsection