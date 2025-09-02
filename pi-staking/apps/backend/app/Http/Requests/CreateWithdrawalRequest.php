<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateWithdrawalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => 'required|numeric|min:20',
            'withdrawal_address' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required' => 'Le montant est requis.',
            'amount.min' => 'Le montant minimum de retrait est de 20 Pi.',
            'withdrawal_address.max' => 'L\'adresse de retrait ne peut pas dépasser 255 caractères.',
            'note.max' => 'La note ne peut pas dépasser 500 caractères.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $user = $this->user();
            $amount = $this->input('amount');

            // Vérifier le solde suffisant
            if ($user->balance_pi < $amount) {
                $validator->errors()->add('amount', 'Solde insuffisant pour effectuer ce retrait.');
            }

            // Vérifier le KYC si requis
            if (config('staking.kyc.required_for_withdrawal') && $user->kyc_status !== 'approved') {
                $validator->errors()->add('kyc', 'Votre KYC doit être approuvé avant de pouvoir effectuer un retrait.');
            }

            // Vérifier les limites quotidiennes/mensuelles
            $dailyLimit = config('staking.limits.daily_withdrawal', 1000);
            $monthlyLimit = config('staking.limits.monthly_withdrawal', 10000);
            
            $todayWithdrawn = $user->withdrawalRequests()
                ->where('status', 'approved')
                ->whereDate('processed_at', today())
                ->sum('amount');
                
            $monthlyWithdrawn = $user->withdrawalRequests()
                ->where('status', 'approved')
                ->where('processed_at', '>=', now()->startOfMonth())
                ->sum('amount');

            if ($todayWithdrawn + $amount > $dailyLimit) {
                $validator->errors()->add('amount', 'Limite quotidienne de retrait dépassée. Limite : ' . $dailyLimit . ' Pi.');
            }

            if ($monthlyWithdrawn + $amount > $monthlyLimit) {
                $validator->errors()->add('amount', 'Limite mensuelle de retrait dépassée. Limite : ' . $monthlyLimit . ' Pi.');
            }
        });
    }
}