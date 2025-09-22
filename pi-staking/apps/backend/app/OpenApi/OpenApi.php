<?php

namespace App\OpenApi;

/**
 * @OA\Info(
 *   title="Pi Staking API",
 *   version="1.0.0",
 *   description="API de la plateforme Pi Staking. Toutes les réponses suivent l'enveloppe standard { success, message, data }."
 * )
 *
 * @OA\Server(
 *   url="/api",
 *   description="API base path"
 * )
 *
 * @OA\SecurityScheme(
 *   securityScheme="sanctum",
 *   type="http",
 *   scheme="bearer",
 *   bearerFormat="Token"
 * )
 *
 * @OA\Tag(name="Auth", description="Authentification & gestion du compte")
 * @OA\Tag(name="Email", description="Vérification email")
 * @OA\Tag(name="Dashboard", description="Dashboard utilisateur")
 * @OA\Tag(name="Staking", description="Packages & investissements")
 * @OA\Tag(name="Claims", description="Réclamations de gains")
 * @OA\Tag(name="Deposit", description="Dépôts Pi Network")
 * @OA\Tag(name="Transactions", description="Historique & retraits")
 * @OA\Tag(name="Referrals", description="Système de parrainage")
 * @OA\Tag(name="Security", description="Sécurité & 2FA")
 * @OA\Tag(name="Admin", description="Endpoints d'administration")
 *
 * @OA\Schema(
 *   schema="SuccessResponse",
 *   type="object",
 *   required={"success"},
 *   properties={
 *     @OA\Property(property="success", type="boolean", example=true),
 *     @OA\Property(property="message", type="string", nullable=true),
 *     @OA\Property(property="data"),
 *   }
 * )
 *
 * @OA\Schema(
 *   schema="ErrorResponse",
 *   type="object",
 *   required={"success","message"},
 *   properties={
 *     @OA\Property(property="success", type="boolean", example=false),
 *     @OA\Property(property="message", type="string", example="Erreur"),
 *     @OA\Property(property="code", type="string", nullable=true, description="Code d'erreur métier (facultatif)"),
 *     @OA\Property(property="errors", type="object", additionalProperties=@OA\Schema(type="array", @OA\Items(type="string")), nullable=true)
 *   }
 * )
 *
 * @OA\Schema(
 *   schema="PaginationMeta",
 *   type="object",
 *   properties={
 *     @OA\Property(property="current_page", type="integer"),
 *     @OA\Property(property="last_page", type="integer"),
 *     @OA\Property(property="per_page", type="integer"),
 *     @OA\Property(property="total", type="integer"),
 *     @OA\Property(property="from", type="integer", nullable=true),
 *     @OA\Property(property="to", type="integer", nullable=true),
 *     @OA\Property(property="path", type="string", nullable=true),
 *     @OA\Property(property="links", type="object",
 *       properties={
 *         @OA\Property(property="first", type="string", nullable=true),
 *         @OA\Property(property="last", type="string", nullable=true),
 *         @OA\Property(property="prev", type="string", nullable=true),
 *         @OA\Property(property="next", type="string", nullable=true)
 *       }
 *     )
 *   }
 * )
 *
 * @OA\Schema(
 *   schema="User",
 *   type="object",
 *   properties={
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="username", type="string"),
 *     @OA\Property(property="email", type="string", format="email"),
 *     @OA\Property(property="first_name", type="string", nullable=true),
 *     @OA\Property(property="last_name", type="string", nullable=true),
 *     @OA\Property(property="email_verified_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="current_level", type="string", enum={"discovery","bronze","silver","gold","diamond"}),
 *     @OA\Property(property="balance_pi", type="number", format="float"),
 *     @OA\Property(property="bonus_balance", type="number", format="float", nullable=true),
 *     @OA\Property(property="total_invested", type="number", format="float"),
 *     @OA\Property(property="total_claimed", type="number", format="float"),
 *     @OA\Property(property="total_withdrawn", type="number", format="float", nullable=true),
 *     @OA\Property(property="kyc_status", type="string"),
 *     @OA\Property(property="two_factor_enabled", type="boolean", nullable=true),
 *     @OA\Property(property="two_factor_enabled_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="phone_verified", type="boolean", nullable=true),
 *     @OA\Property(property="last_activity", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 *   }
 * )
 *
 * @OA\Schema(
 *   schema="StakingPackage",
 *   type="object",
 *   properties={
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="name", type="string"),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="level", type="string", enum={"discovery","bronze","silver","gold","diamond"}, nullable=true),
 *     @OA\Property(property="daily_rate", type="number", format="float"),
 *     @OA\Property(property="min_amount", type="number", format="float"),
 *     @OA\Property(property="max_amount", type="number", format="float", nullable=true),
 *     @OA\Property(property="duration_days", type="integer", nullable=true),
 *     @OA\Property(property="max_duration_days", type="integer", nullable=true),
 *     @OA\Property(property="is_discovery_bonus", type="boolean"),
 *     @OA\Property(property="is_active", type="boolean"),
 *     @OA\Property(property="max_concurrent", type="integer", nullable=true),
 *     @OA\Property(property="features"),
 *     @OA\Property(property="sort_order", type="integer")
 *   }
 * )
 *
 * @OA\Schema(
 *   schema="Investment",
 *   type="object",
 *   properties={
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="user_id", type="integer"),
 *     @OA\Property(property="staking_package_id", type="integer"),
 *     @OA\Property(property="amount", type="number", format="float"),
 *     @OA\Property(property="daily_rate", type="number", format="float"),
 *     @OA\Property(property="total_earned", type="number", format="float", nullable=true),
 *     @OA\Property(property="total_claimed", type="number", format="float", nullable=true),
 *     @OA\Property(property="status", type="string", enum={"active","completed","cancelled","paused"}),
 *     @OA\Property(property="start_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="end_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="next_claim_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="updated_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="stakingPackage", ref="#/components/schemas/StakingPackage", nullable=true),
 *     @OA\Property(property="package", ref="#/components/schemas/StakingPackage", nullable=true)
 *   }
 * )
 *
 * @OA\Schema(
 *   schema="Claim",
 *   type="object",
 *   properties={
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="user_id", type="integer"),
 *     @OA\Property(property="investment_id", type="integer"),
 *     @OA\Property(property="amount", type="number", format="float"),
 *     @OA\Property(property="final_amount", type="number", format="float", nullable=true),
 *     @OA\Property(property="status", type="string", enum={"pending","processed","failed","reversed"}),
 *     @OA\Property(property="transaction_hash", type="string", nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 *   }
 * )
 *
 * @OA\Schema(
 *   schema="Transaction",
 *   type="object",
 *   properties={
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="user_id", type="integer"),
 *     @OA\Property(property="type", type="string", example="deposit"),
 *     @OA\Property(property="category", type="string", nullable=true),
 *     @OA\Property(property="amount", type="number", format="float"),
 *     @OA\Property(property="status", type="string", enum={"pending","completed","failed","cancelled"}),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="processed_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 *   }
 * )
 *
 * @OA\Schema(
 *   schema="WithdrawalRequest",
 *   type="object",
 *   properties={
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="user_id", type="integer"),
 *     @OA\Property(property="amount", type="number", format="float"),
 *     @OA\Property(property="withdrawal_address", type="string", nullable=true),
 *     @OA\Property(property="status", type="string", enum={"pending","approved","rejected","cancelled"}),
 *     @OA\Property(property="processed_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 *   }
 * )
 *
 * @OA\Schema(
 *   schema="Referral",
 *   type="object",
 *   properties={
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="user_id", type="integer"),
 *     @OA\Property(property="referral_code", type="string"),
 *     @OA\Property(property="referred_by", type="integer", nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 *   }
 * )
 *
 * @OA\Schema(
 *   schema="SecurityLog",
 *   type="object",
 *   properties={
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="action", type="string"),
 *     @OA\Property(property="ip_address", type="string"),
 *     @OA\Property(property="device_type", type="string", nullable=true),
 *     @OA\Property(property="location", type="string", nullable=true),
 *     @OA\Property(property="risk_score", type="number", format="float", nullable=true),
 *     @OA\Property(property="severity", type="string", enum={"low","medium","high","critical"}, nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 *   }
 * )
 *
 * @OA\Schema(
 *   schema="LoginRequest",
 *   type="object",
 *   required={"email","password"},
 *   properties={
 *     @OA\Property(property="email", type="string", format="email"),
 *     @OA\Property(property="password", type="string"),
 *   }
 * )
 *
 * @OA\Schema(
 *   schema="RegisterRequest",
 *   type="object",
 *   required={"first_name","last_name","username","email","password","password_confirmation"},
 *   properties={
 *     @OA\Property(property="first_name", type="string"),
 *     @OA\Property(property="last_name", type="string"),
 *     @OA\Property(property="username", type="string"),
 *     @OA\Property(property="email", type="string", format="email"),
 *     @OA\Property(property="password", type="string"),
 *     @OA\Property(property="password_confirmation", type="string"),
 *     @OA\Property(property="referral_code", type="string", nullable=true)
 *   }
 * )
 *
 * @OA\Schema(
 *   schema="CreateInvestmentRequest",
 *   type="object",
 *   required={"staking_package_id","amount","source"},
 *   properties={
 *     @OA\Property(property="staking_package_id", type="integer"),
 *     @OA\Property(property="amount", type="number", format="float", minimum=0.01),
 *     @OA\Property(property="source", type="string", enum={"funds","bonus","claimable","claimable_bonus"})
 *   }
 * )
 *
 * @OA\Schema(
 *   schema="CreateWithdrawalRequest",
 *   type="object",
 *   required={"amount"},
 *   properties={
 *     @OA\Property(property="amount", type="number", format="float", minimum=2),
 *     @OA\Property(property="withdrawal_address", type="string", nullable=true),
 *     @OA\Property(property="note", type="string", nullable=true)
 *   }
 * )
 */
class OpenApi {}
