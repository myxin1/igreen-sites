<?php
/**
 * Plugin Name: Doodly Pretty Links Fix
 * Description: Muda redirect_type do slug 'go' de 307 para 301. Deletar após usar.
 * Version: 1.0
 */
add_action('admin_init', function() {
    if (get_option('doodly_pl_fix_done')) return;

    global $wpdb;
    $table = $wpdb->prefix . 'prli_links';

    $updated = $wpdb->update(
        $table,
        ['redirect_type' => 301],
        ['id' => 1]
    );

    $current = $wpdb->get_row("SELECT id, slug, redirect_type, url FROM {$table} WHERE id = 1");

    update_option('doodly_pl_fix_done', true);
    update_option('doodly_pl_fix_result', [
        'updated' => $updated,
        'current' => $current,
    ]);
});

add_action('admin_notices', function() {
    $result = get_option('doodly_pl_fix_result');
    if (!$result) return;
    $c = $result['current'];
    $ok = $result['updated'] !== false;
    echo '<div class="notice notice-' . ($ok ? 'success' : 'error') . ' is-dismissible" style="font-family:monospace;font-size:12px;padding:12px">';
    echo '<p><strong>Pretty Links Fix</strong></p>';
    if ($c) {
        echo '<p>Slug: <b>' . esc_html($c->slug) . '</b> | redirect_type agora: <b>' . esc_html($c->redirect_type) . '</b> | rows updated: ' . (int)$result['updated'] . '</p>';
    }
    echo '<p><em>Delete este plugin.</em></p></div>';
});
