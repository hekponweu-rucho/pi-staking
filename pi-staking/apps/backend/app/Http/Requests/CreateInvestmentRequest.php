<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateInvestmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'package_id' => 'required|integer|exists:staking_packages,id',
            'amount' => 'required|numeric|min:0.01',
            'source' => 'required|in:funds,bonus',
        ];
    }

    public function messages(): array
    {
        return [
            'package_id.required' => 'Le package de staking est requis.',
            'package_id.exists' => 'Package de staking invalide.',
            'amount.required' => 'Le montant est requis.',
            'amount.min' => 'Le montant minimum est de 0.01 Pi.',
            'source.required' => 'La source de financement est requise.',
            'source.in' => 'Source de financement invalide (funds ou bonus).',
        ];
    }
}