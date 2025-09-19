<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_returns_user_and_token(): void
    {
        $payload = [
            'username' => 'john_doe',
            'email' => 'john@example.com',
            'password' => 'Password123!@#',
            'password_confirmation' => 'Password123!@#',
        ];

        $res = $this->postJson('/api/auth/register', $payload);
        $res->assertStatus(201);
        $res->assertJsonPath('success', true);
        $this->assertNotNull($res->json('data.token'));
        $this->assertNotNull($res->json('data.user.id'));
    }

    public function test_logout_revokes_token(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
        ]);
        $token = $user->createToken('auth')->plainTextToken;
        $res = $this->actingAs($user, 'sanctum')->postJson('/api/auth/logout');
        $res->assertOk();
        $res->assertJsonPath('success', true);
    }

    public function test_refresh_issues_new_token(): void
    {
        $user = User::factory()->create();
        $user->createToken('auth');
        $res = $this->actingAs($user, 'sanctum')->postJson('/api/auth/refresh');
        $res->assertOk();
        $res->assertJsonPath('success', true);
        $this->assertNotNull($res->json('data.token'));
    }
}
