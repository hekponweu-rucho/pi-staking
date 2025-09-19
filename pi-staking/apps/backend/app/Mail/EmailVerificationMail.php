<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EmailVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public string $verifyUrl)
    {
    }

    public function build(): self
    {
        return $this->subject('[Pi Staking] Vérifiez votre adresse email')
            ->view('emails.verify-email')
            ->with([
                'user' => $this->user,
                'verifyUrl' => $this->verifyUrl,
                'expires_in_hours' => 24,
            ]);
    }
}
