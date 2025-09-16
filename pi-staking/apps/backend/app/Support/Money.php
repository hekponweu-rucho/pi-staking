<?php

namespace App\Support;

class Money
{
    public static function add(string|float|int $a, string|float|int $b, ?int $scale = null): string
    {
        $s = $scale ?? self::calcScale();
        return bcadd(self::toStr($a), self::toStr($b), $s);
    }

    public static function sub(string|float|int $a, string|float|int $b, ?int $scale = null): string
    {
        $s = $scale ?? self::calcScale();
        return bcsub(self::toStr($a), self::toStr($b), $s);
    }

    public static function mul(string|float|int $a, string|float|int $b, ?int $scale = null): string
    {
        $s = $scale ?? self::calcScale();
        return bcmul(self::toStr($a), self::toStr($b), $s);
    }

    public static function div(string|float|int $a, string|float|int $b, ?int $scale = null): string
    {
        $s = $scale ?? self::calcScale();
        return bcdiv(self::toStr($a), self::toStr($b), $s);
    }

    public static function cmp(string|float|int $a, string|float|int $b, ?int $scale = null): int
    {
        $s = $scale ?? self::calcScale();
        return bccomp(self::toStr($a), self::toStr($b), $s);
    }

    public static function round(string|float|int $value, ?int $scale = null, ?string $mode = null): string
    {
        $scale = $scale ?? self::scale();
        $mode = $mode ?? self::roundingMode();

        $str = self::toStr($value);
        $neg = str_starts_with($str, '-');
        if ($neg) {
            $str = substr($str, 1);
        }

        if (!str_contains($str, '.')) {
            $str .= '.0';
        }

        $normalized = bcadd($str, '0', $scale + 5);
        [$intPart, $fracPart] = explode('.', $normalized, 2);
        $fracPart = str_pad($fracPart, $scale + 5, '0');

        $keep = substr($fracPart, 0, $scale);
        $rest = substr($fracPart, $scale); // guard + more
        $guard = $rest[0] ?? '0';
        $remainderBeyondGuard = substr($rest, 1);
        $hasMoreNonZero = (bool) preg_match('/[1-9]/', $remainderBeyondGuard);

        $resultInt = $intPart;
        $resultFrac = $keep;

        if ($mode === 'floor') {
            if ($neg && (intval($fracPart) > 0)) {
                [$resultInt, $resultFrac] = self::decimalDecrement($intPart, $keep, $scale);
            }
        } else {
            $roundUp = false;
            if ($mode === 'half_up') {
                $roundUp = ((int)$guard >= 5);
            } elseif ($mode === 'half_even') {
                if ((int)$guard > 5) {
                    $roundUp = true;
                } elseif ((int)$guard < 5) {
                    $roundUp = false;
                } else { // guard == 5
                    if ($hasMoreNonZero) {
                        $roundUp = true; // > .5
                    } else {
                        // tie exactly .5 -> round to even
                        $lastKept = $keep === '' ? '0' : substr($keep, -1);
                        $roundUp = ((int)$lastKept % 2 === 1);
                    }
                }
            } else { // default to half_even
                if ((int)$guard > 5) {
                    $roundUp = true;
                } elseif ((int)$guard < 5) {
                    $roundUp = false;
                } else {
                    if ($hasMoreNonZero) {
                        $roundUp = true;
                    } else {
                        $lastKept = $keep === '' ? '0' : substr($keep, -1);
                        $roundUp = ((int)$lastKept % 2 === 1);
                    }
                }
            }

            if ($roundUp && ($guard !== '0' || $hasMoreNonZero)) {
                [$resultInt, $resultFrac] = self::decimalIncrement($intPart, $keep, $scale);
            }
        }

        $out = $resultInt . ($scale > 0 ? ('.' . str_pad($resultFrac, $scale, '0')) : '');
        if ($neg && $out !== '0' . ($scale > 0 ? '.' . str_repeat('0', $scale) : '')) {
            $out = '-' . $out;
        }
        return $out;
    }

    public static function formatPi(string|float|int $amount, ?int $decimals = null): string
    {
        $decimals = $decimals ?? self::scale();
        $rounded = self::round($amount, $decimals);
        $float = (float) $rounded; // for number_format grouping consistency
        return number_format($float, $decimals) . ' Pi';
    }

    public static function scale(): int
    {
        return (int) (config('finance.scale', 8));
    }

    private static function calcScale(): int
    {
        // Use a few extra digits during intermediate calculations
        return self::scale() + 4;
    }

    private static function roundingMode(): string
    {
        $mode = config('finance.rounding_mode', 'half_even');
        return in_array($mode, ['half_even', 'half_up', 'floor'], true) ? $mode : 'half_even';
    }

    private static function toStr(string|float|int $v): string
    {
        if (is_string($v)) {
            return $v;
        }
        if (is_int($v)) {
            return (string) $v;
        }
        return rtrim(rtrim(sprintf('%.20F', $v), '0'), '.');
    }

    private static function decimalIncrement(string $intPart, string $fracPart, int $scale): array
    {
        if ($scale === 0) {
            $int = (string) ((int) $intPart + 1);
            return [$int, ''];
        }
        $frac = $fracPart;
        $carry = 1;
        for ($i = $scale - 1; $i >= 0; $i--) {
            $d = (int) ($frac[$i] ?? '0') + $carry;
            if ($d >= 10) {
                $frac[$i] = '0';
                $carry = 1;
            } else {
                $frac[$i] = (string) $d;
                $carry = 0;
                break;
            }
        }
        if ($carry === 1) {
            $intPart = (string) ((int) $intPart + 1);
        }
        return [$intPart, $frac];
    }

    private static function decimalDecrement(string $intPart, string $fracPart, int $scale): array
    {
        if ($scale === 0) {
            $int = (string) ((int) $intPart - 1);
            return [$int, ''];
        }
        $frac = $fracPart;
        $borrow = 1;
        for ($i = $scale - 1; $i >= 0; $i--) {
            $d = (int) ($frac[$i] ?? '0') - $borrow;
            if ($d < 0) {
                $frac[$i] = '9';
                $borrow = 1;
            } else {
                $frac[$i] = (string) $d;
                $borrow = 0;
                break;
            }
        }
        if ($borrow === 1) {
            $intPart = (string) ((int) $intPart - 1);
            $frac = str_repeat('9', $scale);
        }
        return [$intPart, $frac];
    }
}
