<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WelcomeEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user)
    {
    }

    public function build(): self
    {
        return $this->subject('Bienvenue sur Pi Staking')
            ->view('emails.welcome')
            ->with([
                'user' => $this->user,
                'dashboardUrl' => env('FRONTEND_URL', url('/')),
            ]);
    }
}
