<?php

namespace App\OpenApi;

/**
 * AUTH
 * @OA\Post(
 *   path="/auth/register",
 *   tags={"Auth"},
 *   summary="Inscription",
 *   @OA\RequestBody(
 *     required=true,
 *     @OA\JsonContent(ref="#/components/schemas/RegisterRequest")
 *   ),
 *   @OA\Response(
 *     response=201,
 *     description="Inscription réussie",
 *     @OA\JsonContent(allOf={
 *       @OA\Schema(ref="#/components/schemas/SuccessResponse"),
 *       @OA\Schema(@OA\Property(property="data", type="object",
 *         @OA\Property(property="user", ref="#/components/schemas/User"),
 *         @OA\Property(property="token", type="string")
 *       ))
 *     })
 *   )
 * )
 *
 * @OA\Post(
 *   path="/auth/login",
 *   tags={"Auth"},
 *   summary="Connexion",
 *   @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/LoginRequest")),
 *   @OA\Response(response=200, description="OK",
 *     @OA\JsonContent(allOf={
 *       @OA\Schema(ref="#/components/schemas/SuccessResponse"),
 *       @OA\Schema(@OA\Property(property="data", type="object",
 *         @OA\Property(property="user", ref="#/components/schemas/User"),
 *         @OA\Property(property="token", type="string")
 *       ))
 *     })
 *   )
 * )
 *
 * @OA\Post(path="/auth/forgot-password", tags={"Auth"}, summary="Mot de passe oublié",
 *   @OA\RequestBody(required=true, @OA\JsonContent(type="object", required={"email"}, @OA\Property(property="email", type="string", format="email"))),
 *   @OA\Response(response=200, description="Lien envoyé", @OA\JsonContent(ref="#/components/schemas/SuccessResponse"))
 * )
 *
 * @OA\Post(path="/auth/reset-password", tags={"Auth"}, summary="Réinitialiser mot de passe",
 *   @OA\RequestBody(required=true, @OA\JsonContent(type="object", required={"token","email","password","password_confirmation"},
 *     @OA\Property(property="token", type="string"),
 *     @OA\Property(property="email", type="string", format="email"),
 *     @OA\Property(property="password", type="string"),
 *     @OA\Property(property="password_confirmation", type="string")
 *   )),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse"))
 * )
 *
 * @OA\Get(path="/auth/email/verify", tags={"Email"}, summary="Vérifier l'email",
 *   @OA\Parameter(name="id", in="query", required=true, @OA\Schema(type="string")),
 *   @OA\Parameter(name="hash", in="query", required=true, @OA\Schema(type="string")),
 *   @OA\Response(response=200, description="Email vérifié", @OA\JsonContent(ref="#/components/schemas/SuccessResponse"))
 * )
 *
 * @OA\Post(path="/auth/email/resend", tags={"Email"}, summary="Renvoyer l'email de vérification", security={{"sanctum":{}}},
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse"))
 * )
 * @OA\Get(path="/auth/email/status", tags={"Email"}, summary="Statut de vérification", security={{"sanctum":{}}},
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse"))
 * )
 * @OA\Post(path="/auth/logout", tags={"Auth"}, summary="Déconnexion", security={{"sanctum":{}}},
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse"))
 * )
 * @OA\Get(path="/auth/me", tags={"Auth"}, summary="Utilisateur courant", security={{"sanctum":{}}},
 *   @OA\Response(response=200, description="OK",
 *     @OA\JsonContent(allOf={@OA\Schema(ref="#/components/schemas/SuccessResponse"), @OA\Schema(@OA\Property(property="data", ref="#/components/schemas/User"))})
 *   )
 * )
 * @OA\Post(path="/auth/refresh", tags={"Auth"}, summary="Renouveler le token", security={{"sanctum":{}}},
 *   @OA\Response(response=200, description="OK",
 *     @OA\JsonContent(allOf={@OA\Schema(ref="#/components/schemas/SuccessResponse"), @OA\Schema(@OA\Property(property="data", type="object", @OA\Property(property="user", ref="#/components/schemas/User"), @OA\Property(property="token", type="string")))})
 *   )
 * )
 * @OA\Post(path="/auth/update-profile", tags={"Auth"}, summary="Mettre à jour le profil", security={{"sanctum":{}}},
 *   @OA\RequestBody(required=false, @OA\JsonContent(type="object")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse"))
 * )
 * @OA\Post(path="/auth/change-password", tags={"Auth"}, summary="Changer le mot de passe", security={{"sanctum":{}}},
 *   @OA\RequestBody(required=true, @OA\JsonContent(type="object", required={"current_password","new_password"}, @OA\Property(property="current_password", type="string"), @OA\Property(property="new_password", type="string"), @OA\Property(property="new_password_confirmation", type="string"))),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse"))
 * )
 * @OA\Post(path="/auth/claim-welcome-bonus", tags={"Auth"}, summary="Réclamer le bonus de bienvenue", security={{"sanctum":{}}},
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse"))
 * )
 *
 * DASHBOARD
 * @OA\Get(path="/dashboard", tags={"Dashboard"}, summary="Données du dashboard", security={{"sanctum":{}}},
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse"))
 * )
 * @OA\Get(path="/dashboard/financial-summary", tags={"Dashboard"}, summary="Résumé financier", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/dashboard/performance", tags={"Dashboard"}, summary="Métriques de performance", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/dashboard/notifications", tags={"Dashboard"}, summary="Notifications", security={{"sanctum":{}}}, @OA\Parameter(name="unread_only", in="query", @OA\Schema(type="boolean")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Patch(path="/dashboard/notifications/{id}/read", tags={"Dashboard"}, summary="Marquer une notification comme lue", security={{"sanctum":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Patch(path="/dashboard/notifications/mark-all-read", tags={"Dashboard"}, summary="Tout marquer comme lu", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/dashboard/charts", tags={"Dashboard"}, summary="Données graphiques", security={{"sanctum":{}}}, @OA\Parameter(name="period", in="query", @OA\Schema(type="string", enum={"week","month","year"})), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * STAKING
 * @OA\Get(path="/staking/packages", tags={"Staking"}, summary="Liste des packages", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(allOf={@OA\Schema(ref="#/components/schemas/SuccessResponse"), @OA\Schema(@OA\Property(property="data", type="object", @OA\Property(property="packages", type="array", @OA\Items(ref="#/components/schemas/StakingPackage"))))}) ))
 * @OA\Post(path="/staking/invest", tags={"Staking"}, summary="Créer un investissement", security={{"sanctum":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/CreateInvestmentRequest")), @OA\Response(response=201, description="Créé", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/staking/investments", tags={"Staking"}, summary="Investissements utilisateur", security={{"sanctum":{}}}, @OA\Parameter(name="status", in="query", @OA\Schema(type="string", enum={"active","completed","cancelled"})), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/staking/investment/{id}", tags={"Staking"}, summary="Détails investissement", security={{"sanctum":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/staking/calculate-earnings", tags={"Staking"}, summary="Calculer les gains", security={{"sanctum":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(type="object", required={"staking_package_id","amount"}, @OA\Property(property="staking_package_id", type="integer"), @OA\Property(property="amount", type="number", format="float"))), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/staking/performance", tags={"Staking"}, summary="Historique de performance", security={{"sanctum":{}}}, @OA\Parameter(name="period", in="query", @OA\Schema(type="string", enum={"7days","30days","90days","1year"})), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/staking/reinvest-bonus", tags={"Staking"}, summary="Réinvestir bonus", security={{"sanctum":{}}}, @OA\Response(response=201, description="Créé", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/staking/reinvest", tags={"Staking"}, summary="Réinvestir (claimable)", security={{"sanctum":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/CreateInvestmentRequest")), @OA\Response(response=201, description="Créé", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/staking/reinvest-quick", tags={"Staking"}, summary="Réinvestissement rapide", security={{"sanctum":{}}}, @OA\Response(response=201, description="Créé", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * CLAIMS
 * @OA\Get(path="/claims/available", tags={"Claims"}, summary="Investissements réclamables", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/claims/{investment}", tags={"Claims"}, summary="Réclamer un investissement", security={{"sanctum":{}}}, @OA\Parameter(name="investment", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/claims/history", tags={"Claims"}, summary="Historique des réclamations", security={{"sanctum":{}}}, @OA\Parameter(name="page", in="query", @OA\Schema(type="integer")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/claims/statistics", tags={"Claims"}, summary="Statistiques de réclamation", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/claims/bulk-claim", tags={"Claims"}, summary="Réclamation en masse", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/claims/simulate-earnings", tags={"Claims"}, summary="Simulation de gains", security={{"sanctum":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(type="object", required={"investment_id"}, @OA\Property(property="investment_id", type="integer"))), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * DEPOSIT
 * @OA\Post(path="/deposit/request", tags={"Deposit"}, summary="Demander une adresse de dépôt", security={{"sanctum":{}}}, @OA\RequestBody(required=false), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/deposit/status/{id}", tags={"Deposit"}, summary="Statut de dépôt", security={{"sanctum":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * TRANSACTIONS
 * @OA\Get(path="/transactions", tags={"Transactions"}, summary="Transactions utilisateur", security={{"sanctum":{}}}, @OA\Parameter(name="page", in="query", @OA\Schema(type="integer")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/transactions/limits", tags={"Transactions"}, summary="Limites & stats", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/transactions/stats", tags={"Transactions"}, summary="Statistiques", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/transactions/search", tags={"Transactions"}, summary="Recherche de transactions", security={{"sanctum":{}}}, @OA\Parameter(name="q", in="query", @OA\Schema(type="string")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/transactions/{id}", tags={"Transactions"}, summary="Transaction par id", security={{"sanctum":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/transactions/export", tags={"Transactions"}, summary="Exporter transactions", security={{"sanctum":{}}}, @OA\RequestBody(required=false), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/transactions/withdrawal", tags={"Transactions"}, summary="Créer une demande de retrait", security={{"sanctum":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/CreateWithdrawalRequest")), @OA\Response(response=201, description="Créé", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/transactions/withdrawals", tags={"Transactions"}, summary="Demandes de retrait", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Patch(path="/transactions/withdrawal/{id}/cancel", tags={"Transactions"}, summary="Annuler un retrait", security={{"sanctum":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * REFERRALS
 * @OA\Get(path="/referrals/info", tags={"Referrals"}, summary="Infos parrainage", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/referrals/tree", tags={"Referrals"}, summary="Arbre de parrainage", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/referrals/earnings", tags={"Referrals"}, summary="Gains de parrainage", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/referrals/stats", tags={"Referrals"}, summary="Statistiques détaillées", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/referrals/validate-code", tags={"Referrals"}, summary="Valider un code de parrainage", security={{"sanctum":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(type="object", required={"code"}, @OA\Property(property="code", type="string"))), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * SECURITY
 * @OA\Post(path="/security/2fa/setup", tags={"Security"}, summary="Configurer 2FA", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/security/2fa/confirm", tags={"Security"}, summary="Confirmer 2FA", security={{"sanctum":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(type="object", required={"code","setup_key"}, @OA\Property(property="code", type="string"), @OA\Property(property="setup_key", type="string"))), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/security/2fa/verify", tags={"Security"}, summary="Vérifier 2FA", security={{"sanctum":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(type="object", required={"code"}, @OA\Property(property="code", type="string"))), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/security/2fa/disable", tags={"Security"}, summary="Désactiver 2FA", security={{"sanctum":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(type="object", required={"password"}, @OA\Property(property="password", type="string"), @OA\Property(property="code", type="string", nullable=true))), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/security/2fa/status", tags={"Security"}, summary="Statut 2FA", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(allOf={@OA\Schema(ref="#/components/schemas/SuccessResponse")})) )
 *
 * @OA\Post(path="/security/withdrawal/initiate-verification", tags={"Security"}, summary="Initier vérification retrait", security={{"sanctum":{}}}, @OA\RequestBody(required=false), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/security/withdrawal/confirm-verification", tags={"Security"}, summary="Confirmer vérification retrait", security={{"sanctum":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(type="object", required={"code"}, @OA\Property(property="code", type="string"))), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/security/withdrawal/limits", tags={"Security"}, summary="Limites de retrait", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * @OA\Get(path="/security/logs", tags={"Security"}, summary="Logs de sécurité", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/security/activity", tags={"Security"}, summary="Activité récente", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/security/stats", tags={"Security"}, summary="Statistiques sécurité", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/security/preferences", tags={"Security"}, summary="Préférences", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Patch(path="/security/preferences", tags={"Security"}, summary="Mettre à jour préférences", security={{"sanctum":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(type="object")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/security/account-status", tags={"Security"}, summary="Statut du compte", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * ADMIN
 * @OA\Get(path="/admin/dashboard", tags={"Admin"}, summary="Stats admin", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/admin/analytics", tags={"Admin"}, summary="Analytics admin", security={{"sanctum":{}}}, @OA\Parameter(name="period", in="query", @OA\Schema(type="string", enum={"week","month","year"})), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * @OA\Get(path="/admin/deposits", tags={"Admin"}, summary="Liste dépôts", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/admin/deposits/{id}/expire", tags={"Admin"}, summary="Expirer un dépôt", security={{"sanctum":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/admin/deposits/{id}/confirm", tags={"Admin"}, summary="Confirmer un dépôt", security={{"sanctum":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * @OA\Get(path="/admin/withdrawals", tags={"Admin"}, summary="Liste retraits", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Patch(path="/admin/withdrawals/{id}", tags={"Admin"}, summary="Mettre à jour retrait", security={{"sanctum":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\RequestBody(required=true, @OA\JsonContent(type="object", @OA\Property(property="status", type="string"))), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * @OA\Get(path="/admin/users", tags={"Admin"}, summary="Liste utilisateurs", security={{"sanctum":{}}}, @OA\Parameter(name="page", in="query", @OA\Schema(type="integer")), @OA\Parameter(name="search", in="query", @OA\Schema(type="string")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Patch(path="/admin/users/{user}", tags={"Admin"}, summary="Mettre à jour utilisateur", security={{"sanctum":{}}}, @OA\Parameter(name="user", in="path", required=true, @OA\Schema(type="integer")), @OA\RequestBody(required=true, @OA\JsonContent(type="object")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/admin/users/{user}/details", tags={"Admin"}, summary="Détails utilisateur", security={{"sanctum":{}}}, @OA\Parameter(name="user", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * @OA\Get(path="/admin/transactions", tags={"Admin"}, summary="Transactions (admin)", security={{"sanctum":{}}}, @OA\Parameter(name="page", in="query", @OA\Schema(type="integer")), @OA\Parameter(name="type", in="query", @OA\Schema(type="string")), @OA\Parameter(name="status", in="query", @OA\Schema(type="string")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/admin/transactions/export", tags={"Admin"}, summary="Exporter transactions CSV", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Patch(path="/admin/transactions/{transaction}/status", tags={"Admin"}, summary="MAJ statut transaction", security={{"sanctum":{}}}, @OA\Parameter(name="transaction", in="path", required=true, @OA\Schema(type="integer")), @OA\RequestBody(required=true, @OA\JsonContent(type="object", @OA\Property(property="status", type="string"))), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * @OA\Get(path="/admin/packages", tags={"Admin"}, summary="Packages (admin)", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/admin/packages", tags={"Admin"}, summary="Créer un package", security={{"sanctum":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/StakingPackage")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Patch(path="/admin/packages/{package}", tags={"Admin"}, summary="MAJ package", security={{"sanctum":{}}}, @OA\Parameter(name="package", in="path", required=true, @OA\Schema(type="integer")), @OA\RequestBody(required=true, @OA\JsonContent(type="object")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * @OA\Get(path="/admin/alerts", tags={"Admin"}, summary="Alertes système", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/admin/alerts", tags={"Admin"}, summary="Créer alerte", security={{"sanctum":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(type="object", required={"title","message"}, @OA\Property(property="title", type="string"), @OA\Property(property="message", type="string"))), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Patch(path="/admin/alerts/{alert}/resolve", tags={"Admin"}, summary="Résoudre alerte", security={{"sanctum":{}}}, @OA\Parameter(name="alert", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * @OA\Get(path="/admin/reports/users", tags={"Admin"}, summary="Rapport utilisateurs", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/admin/reports/financial", tags={"Admin"}, summary="Rapport financier", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * ADMIN REFERRALS
 * @OA\Get(path="/admin/referrals/dashboard", tags={"Admin"}, summary="Dashboard parrainage (admin)", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/admin/referrals/stats/global", tags={"Admin"}, summary="Stats globales parrainage", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/admin/referrals/stats/levels", tags={"Admin"}, summary="Stats par niveau", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/admin/referrals/stats/monthly-growth", tags={"Admin"}, summary="Croissance mensuelle", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/admin/referrals/stats/realtime", tags={"Admin"}, summary="Temps réel parrainage", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/admin/referrals/top-referrers", tags={"Admin"}, summary="Top parrains", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/admin/referrals/recent-activities", tags={"Admin"}, summary="Activités récentes", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/admin/referrals/system-alerts", tags={"Admin"}, summary="Alertes du système de parrainage", security={{"sanctum":{}}}, @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Get(path="/admin/referrals/search", tags={"Admin"}, summary="Recherche parrainage", security={{"sanctum":{}}}, @OA\Parameter(name="q", in="query", @OA\Schema(type="string")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 * @OA\Post(path="/admin/referrals/export", tags={"Admin"}, summary="Exporter parrainage", security={{"sanctum":{}}}, @OA\RequestBody(required=false), @OA\Response(response=200, description="OK"))
 * @OA\Patch(path="/admin/referrals/{referral}/manage", tags={"Admin"}, summary="Gérer un parrainage", security={{"sanctum":{}}}, @OA\Parameter(name="referral", in="path", required=true, @OA\Schema(type="integer")), @OA\RequestBody(required=true, @OA\JsonContent(type="object")), @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")))
 *
 * MISC
 * @OA\Get(path="/health", tags={"Dashboard"}, summary="Health check",
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(type="object", @OA\Property(property="status", type="string", example="OK"), @OA\Property(property="timestamp", type="string")))
 * )
 * @OA\Get(path="/metrics", tags={"Admin"}, summary="Prometheus metrics", @OA\Parameter(name="X-Metrics-Token", in="header", @OA\Schema(type="string")), @OA\Response(response=200, description="Text metrics"))
 */
class Routes {}
