<?php

declare(strict_types=1);

it('returns 200 from the health endpoint', function (): void {
    $response = $this->get('/up');

    $response->assertOk();
});
