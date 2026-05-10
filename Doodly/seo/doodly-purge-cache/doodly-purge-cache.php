<?php
/**
 * Plugin Name: Doodly Purge Cache
 * Description: Limpa o LiteSpeed Cache. Ative, veja a mensagem e delete.
 * Version: 1.0
 */

add_action('admin_init', function() {
    if (get_option('doodly_cache_purged')) return;

    // LiteSpeed Cache — todos os métodos conhecidos
    do_action('litespeed_purge_all');
    do_action('litespeed_api_purge_all');

    if (class_exists('LiteSpeed_Cache_API')) {
        LiteSpeed_Cache_API::purge_all();
    }
    if (class_exists('\LiteSpeed\Purge')) {
        \LiteSpeed\Purge::purge_all();
    }

    update_option('doodly_cache_purged', true);
});

add_action('admin_notices', function() {
    if (!get_option('doodly_cache_purged')) return;
    echo '<div class="notice notice-success is-dismissible"><p>
        <strong>✅ LiteSpeed Cache limpo com sucesso.</strong>
        Pode desativar e deletar este plugin.
    </p></div>';
});
