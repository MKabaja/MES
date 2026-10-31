<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class RejectMalformedInput
{
    private const FORBIDDEN_CONTROL_CHARACTERS = '/[\x00-\x08\x0B\x0C\x0E-\x1F]/';

    /**
     * Rejects the request with 400 when any query or body key or value is not valid UTF-8 or contains a C0 control character other than tab, line feed or carriage return.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->containsMalformedText($request->query->all())
            || $this->containsMalformedText($request->request->all())) {
            throw new BadRequestHttpException;
        }

        return $next($request);
    }

    /**
     * @param  array<array-key, mixed>  $input
     */
    private function containsMalformedText(array $input): bool
    {
        foreach ($input as $key => $value) {
            if (is_string($key) && $this->isMalformed($key)) {
                return true;
            }

            if (is_string($value) && $this->isMalformed($value)) {
                return true;
            }

            if (is_array($value) && $this->containsMalformedText($value)) {
                return true;
            }
        }

        return false;
    }

    private function isMalformed(string $text): bool
    {
        return ! mb_check_encoding($text, 'UTF-8')
            || preg_match(self::FORBIDDEN_CONTROL_CHARACTERS, $text) === 1;
    }
}
