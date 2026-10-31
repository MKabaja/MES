<?php

declare(strict_types=1);

namespace App\Support\Console;

class StandardInput
{
    /**
     * Reads one line from standard input without its line ending, or null when nothing was provided.
     */
    public function readLine(): ?string
    {
        $line = fgets(STDIN);

        if ($line === false) {
            return null;
        }

        return rtrim($line, "\r\n");
    }
}
