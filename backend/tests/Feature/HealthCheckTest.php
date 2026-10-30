<?php

declare(strict_types=1);

it('returns 200 from the health endpoint', function (): void {
    $response = $this->get('/up');

    $response->assertOk();
});

it('returns 404 for the root path', function (): void {
    $response = $this->get('/');

    $response->assertNotFound();
});
