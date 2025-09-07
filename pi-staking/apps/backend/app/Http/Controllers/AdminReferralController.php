<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReferralController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'role:admin']);
    }

    public function getDashboard(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => [
            'overview' => [
                'total_referrals' => 0,
                'active_referrals' => 0,
                'conversion_rate' => 0,
            ],
            'recent' => []
        ]]);
    }

    public function getGlobalStats(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => [
            'levels' => [],
            'growth' => [],
            'totals' => [
                'users_with_referrals' => 0,
                'referral_earnings_total' => 0,
            ],
        ]]);
    }

    public function getLevelMetrics(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function getMonthlyGrowth(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function getRealTimeMetrics(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => [
            'last_minute' => 0,
            'last_hour' => 0,
            'last_day' => 0,
        ]]);
    }

    public function getTopReferrers(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function getRecentActivities(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function getSystemAlerts(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function searchReferrals(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => [
            'query' => $request->get('q'),
            'results' => []
        ]]);
    }

    public function exportData(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Export en cours', 'data' => []]);
    }

    public function manageReferral($referralId, Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Action effectuée', 'data' => [
            'referral_id' => $referralId,
            'action' => $request->get('action')
        ]]);
    }
}
