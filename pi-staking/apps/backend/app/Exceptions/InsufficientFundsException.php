<?php

namespace App\Exceptions;

use Exception;

class InsufficientFundsException extends Exception
{
    public function __construct(string $message = "Fonds insuffisants pour cette opération")
    {
        parent::__construct($message);
    }
}