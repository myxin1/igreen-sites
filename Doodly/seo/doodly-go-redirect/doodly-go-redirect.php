<?php
/**
 * Plugin Name: Doodly Go Redirect
 * Description: Redireciona /go para o link de afiliado com 301 permanente. Manter ativo.
 * Version: 1.0
 */

add_action('init', function() {
    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

    if ($path === 'go') {
        wp_redirect(
            'https://www.doodly.com/doodly-p?aff=cec63c8d-1bd2-4d34-b4d6-b72e51529075',
            301
        );
        exit;
    }
});
