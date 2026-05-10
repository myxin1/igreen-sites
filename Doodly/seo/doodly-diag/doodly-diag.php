<?php
/**
 * Plugin Name: Doodly Redirect Diagnostics
 * Description: Descobre o que está gerando o redirect /go e mostra o .htaccess. Deletar após usar.
 * Version: 1.0
 */
add_action('admin_notices', function() {
    $log = [];

    // 1. Conteúdo do .htaccess
    $htaccess = get_home_path() . '.htaccess';
    if (file_exists($htaccess)) {
        $content = file_get_contents($htaccess);
        // Extrai linhas relevantes para /go
        $lines = explode("\n", $content);
        $relevant = array_filter($lines, fn($l) =>
            stripos($l, '/go') !== false ||
            stripos($l, 'doodly.com') !== false ||
            stripos($l, 'R=307') !== false ||
            stripos($l, 'R=301') !== false
        );
        if ($relevant) {
            $log[] = "📄 .htaccess — linhas com /go ou doodly.com:";
            foreach ($relevant as $l) $log[] = "   " . trim($l);
        } else {
            $log[] = "📄 .htaccess: nenhuma linha com /go encontrada";
        }
    } else {
        $log[] = "❌ .htaccess não encontrado em: " . $htaccess;
    }

    // 2. ThirstyAffiliates
    global $wpdb;
    $ta = get_page_by_path('go', OBJECT, 'thirstylink');
    if ($ta) {
        $log[] = "🔗 ThirstyAffiliates: link 'go' encontrado (ID {$ta->ID}) — tipo de redirect: "
               . (get_post_meta($ta->ID, '_use_redirect_type', true) ?: 'padrão do plugin');
    } else {
        $log[] = "ℹ️ ThirstyAffiliates: nenhum link 'go' encontrado";
    }

    // 3. Pretty Links
    $pl_table = $wpdb->prefix . 'prli_links';
    if ($wpdb->get_var("SHOW TABLES LIKE '{$pl_table}'") === $pl_table) {
        $row = $wpdb->get_row("SELECT * FROM {$pl_table} WHERE slug = 'go' LIMIT 1");
        if ($row) {
            $log[] = "🔗 Pretty Links: slug 'go' encontrado (ID {$row->id}), redirect_type={$row->redirect_type}, URL={$row->url}";
        } else {
            $log[] = "ℹ️ Pretty Links: nenhum slug 'go'";
        }
    } else {
        $log[] = "ℹ️ Pretty Links: tabela não existe";
    }

    // 4. Post type 'redirect' (Safe Redirect Manager)
    $srm = get_page_by_path('go', OBJECT, 'redirect');
    if ($srm) {
        $log[] = "🔗 Safe Redirect Manager: entrada 'go' encontrada (ID {$srm->ID})";
    }

    // 5. Outros custom post types com /go
    $cpts = $wpdb->get_results(
        "SELECT ID, post_type, post_name, post_status FROM {$wpdb->posts}
         WHERE post_name = 'go' AND post_status = 'publish'"
    );
    foreach ($cpts as $p) {
        $log[] = "📌 Post encontrado: ID={$p->ID}, type={$p->post_type}, name={$p->post_name}";
    }

    // 6. wp_options com /go
    $opts = $wpdb->get_results(
        "SELECT option_name, SUBSTRING(option_value, 1, 200) as val
         FROM {$wpdb->options}
         WHERE option_value LIKE '%/go%' AND option_value LIKE '%doodly.com%'
         LIMIT 5"
    );
    foreach ($opts as $o) {
        $log[] = "⚙️ Option '{$o->option_name}': " . substr($o->val, 0, 100);
    }

    // Output
    echo '<div class="notice notice-info" style="font-family:monospace;font-size:11px;padding:12px 16px;max-height:400px;overflow:auto">';
    echo '<p><strong>🔍 Doodly Redirect Diagnostics</strong></p>';
    echo '<ul style="margin:4px 0;list-style:disc;padding-left:20px">';
    foreach ($log as $l) echo '<li>' . esc_html($l) . '</li>';
    echo '</ul>';
    echo '<p style="margin-top:8px"><em>Delete este plugin após usar.</em></p></div>';
});
