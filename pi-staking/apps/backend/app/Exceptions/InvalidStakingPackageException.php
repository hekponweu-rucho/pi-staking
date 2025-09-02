<?php

namespace App\Exceptions;

use Exception;

class InvalidStakingPackageException extends Exception
{
    public function __construct(string $message = "Package de staking invalide ou indisponible")
    {
        parent::__construct($message);
    }
}