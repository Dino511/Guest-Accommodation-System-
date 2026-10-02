<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * A Philippine mobile number: 09XX XXX XXXX or +63 9XX XXX XXXX.
 * Spaces and dashes between the groups are allowed.
 */
class PhilippineMobileNumber implements ValidationRule
{
    public const PATTERN = '/^(?:\+?63|0)[\s-]?9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/';

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || preg_match(self::PATTERN, trim($value)) !== 1) {
            $fail('The :attribute must be a Philippine mobile number, such as 0917 123 4567 or +63 917 123 4567.');
        }
    }
}
