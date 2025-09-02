<?php

namespace App\Exceptions;

use Exception;

class ClaimNotAllowedException extends Exception
{
    public function __construct(string $message = "Cette réclamation n'est pas autorisée pour le moment")
    {
        parent::__construct($message);
    }
}