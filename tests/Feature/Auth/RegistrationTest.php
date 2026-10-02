<?php

namespace Tests\Feature\Auth;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::registration());
    }

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_can_register_as_guests()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'contact_number' => '0917 123 4567',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

        $user = User::where('email', 'test@example.com')->firstOrFail();
        $this->assertSame(Role::Guest, $user->role);
        $this->assertSame('0917 123 4567', $user->guest->contact_number);
    }

    public function test_registration_requires_a_contact_number()
    {
        $this->post(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors('contact_number');

        $this->assertGuest();
    }

    public function test_registration_requires_a_philippine_mobile_number()
    {
        foreach (['0000000000000000000000', '1234567', '0817 123 4567', '0917 123 456', '+1 917 123 4567'] as $number) {
            $this->post(route('register.store'), [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'contact_number' => $number,
                'password' => 'password',
                'password_confirmation' => 'password',
            ])->assertSessionHasErrors('contact_number');
        }

        $this->assertGuest();
    }

    public function test_registration_accepts_the_international_format()
    {
        $this->post(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'contact_number' => '+63 917 123 4567',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasNoErrors();

        $this->assertAuthenticated();
    }

    public function test_registration_cannot_choose_a_staff_role()
    {
        $this->post(route('register.store'), [
            'name' => 'Sneaky',
            'email' => 'sneaky@example.com',
            'contact_number' => '09171234567',
            'role' => 'admin',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertSame(Role::Guest, User::where('email', 'sneaky@example.com')->firstOrFail()->role);
    }
}
