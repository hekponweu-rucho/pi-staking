<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminUserUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::findOrCreate('admin');
    }

    public function test_admin_can_update_user_and_reset_2fa(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create([
            'current_level' => 'bronze',
            'two_factor_enabled' => true,
            'two_factor_enabled_at' => now(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/admin/users/' . $user->id, [
                'current_level' => 'silver',
                'is_active' => false,
                'reset_two_factor' => true,
            ]);

        $response->assertOk();
        $fresh = $user->fresh();
        $this->assertEquals('silver', $fresh->current_level);
        $this->assertNotNull($fresh->suspended_at);
        $this->assertFalse((bool) $fresh->two_factor_enabled);
        $this->assertNull($fresh->two_factor_enabled_at);
    }
}
