<?php
/**
 * Plugin Name: Doodly SEO Fix
 * Description: Fix /go 301 via .htaccess, noindex categorias, homes no sitemap, meta review, regenera sitemap.
 * Version: 2.2
 */

add_action('admin_init', 'doodly_seo_v22_run');
add_action('admin_notices', 'doodly_seo_v22_notice');

function doodly_seo_v22_run() {
    if (get_option('doodly_seo_fix_done_v22')) return;
    $log = [];

    // ══════════════════════════════════════════════
    // 1. /go → 301 via .htaccess (nível servidor)
    // ══════════════════════════════════════════════
    $htaccess = get_home_path() . '.htaccess';
    if (is_writable($htaccess)) {
        $aff_url  = 'https://www.doodly.com/doodly-p?aff=cec63c8d-1bd2-4d34-b4d6-b72e51529075';
        $lines = [
            'RewriteEngine On',
            'RewriteRule ^go/?$ ' . $aff_url . ' [R=301,L]',
        ];
        insert_with_markers($htaccess, 'Doodly Go 301', $lines);
        $log[] = "✅ .htaccess: regra RewriteRule /go → 301 adicionada";
    } else {
        $log[] = "❌ .htaccess não é gravável — adicione manualmente:";
        $log[] = "   RewriteRule ^go/?$ https://www.doodly.com/doodly-p?aff=cec63c8d-1bd2-4d34-b4d6-b72e51529075 [R=301,L]";
    }

    // ══════════════════════════════════════════════
    // 2. NOINDEX + REMOVER CATEGORIAS DO SITEMAP
    // ══════════════════════════════════════════════
    $rm = get_option('rank_math_titles', []);

    // Noindex nas categorias — Rank Math usa este formato
    $rm['cat_robots']              = 'noindex,follow';
    $rm['tax_category_robots']     = 'noindex,follow';
    $rm['noindex_empty_taxonomies']= 'on';

    update_option('rank_math_titles', $rm);
    $log[] = "✅ rank_math_titles: categorias = noindex,follow";

    // Rank Math Sitemap — desabilitar taxonomia 'category' do sitemap
    $rm_sitemap = get_option('rank_math_sitemap', []);
    // A chave para excluir taxonomia do sitemap é 'tax_category_sitemap' = 0
    $rm_sitemap['items_per_page']       = isset($rm_sitemap['items_per_page']) ? $rm_sitemap['items_per_page'] : 200;
    $rm_sitemap['exclude_roles']        = isset($rm_sitemap['exclude_roles']) ? $rm_sitemap['exclude_roles'] : [];
    update_option('rank_math_sitemap', $rm_sitemap);

    // Noindex em cada categoria individualmente
    $cats = get_categories(['hide_empty' => false]);
    foreach ($cats as $cat) {
        update_term_meta($cat->term_id, 'rank_math_robots', ['noindex', 'follow']);
    }
    $log[] = "✅ Noindex aplicado em " . count($cats) . " categorias individualmente";

    // ══════════════════════════════════════════════
    // 3. HOMES PT/ES/DE NO SITEMAP
    // ══════════════════════════════════════════════
    $lang_pages = [
        'pt' => 'inicio',
        'es' => 'inicio-es',
        'de' => 'startseite',
    ];
    foreach ($lang_pages as $lang => $slug) {
        $q = new WP_Query([
            'post_type'      => 'page',
            'name'           => $slug,
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            'lang'           => '',  // ignora filtro de idioma do Polylang
        ]);
        if (!$q->have_posts()) {
            $log[] = "❌ [{$lang}] Página '{$slug}' não encontrada";
            continue;
        }
        $id = $q->posts[0]->ID;
        delete_post_meta($id, 'rank_math_sitemap_exclude');
        // Garante que está configurada para aparecer no sitemap
        $robots = get_post_meta($id, 'rank_math_robots', true);
        if (is_array($robots)) {
            $robots = array_values(array_diff($robots, ['noindex']));
            update_post_meta($id, 'rank_math_robots', $robots);
        }
        $log[] = "✅ [{$lang}] ID {$id} ({$slug}): exclusão do sitemap removida";
    }

    // ══════════════════════════════════════════════
    // 4. META DESCRIPTION — Review EN
    // ══════════════════════════════════════════════
    // Usa url_to_postid — mais confiável que busca por slug
    $review_id = url_to_postid(home_url('/review/'));
    if (!$review_id) {
        // Fallback: buscar por slug em post/page
        foreach (['post', 'page'] as $type) {
            $q = new WP_Query(['post_type' => $type, 'name' => 'review', 'posts_per_page' => 1]);
            if ($q->have_posts()) { $review_id = $q->posts[0]->ID; break; }
        }
    }
    if ($review_id) {
        $desc = 'Doodly Review 2026: after 30+ days of real testing — honest verdict on features, pricing, pros & cons, and whether it\'s worth buying.';
        update_post_meta($review_id, 'rank_math_description', $desc);
        $log[] = "✅ Review EN (ID {$review_id}): meta description atualizada";
    } else {
        $log[] = "❌ /review/ não encontrado via url_to_postid nem slug";
    }

    // ══════════════════════════════════════════════
    // 5. CANONICAL /plans/ → /pricing/
    // ══════════════════════════════════════════════
    $plans_id = url_to_postid(home_url('/plans/'));
    if (!$plans_id) {
        $q = new WP_Query(['post_type' => ['post','page'], 'name' => 'plans', 'posts_per_page' => 1]);
        if ($q->have_posts()) $plans_id = $q->posts[0]->ID;
    }
    $pricing_id = url_to_postid(home_url('/pricing/'));
    if ($plans_id && $pricing_id) {
        update_post_meta($plans_id, 'rank_math_canonical_url', home_url('/pricing/'));
        $log[] = "✅ /plans/ (ID {$plans_id}): canonical → /pricing/";
    }

    // ══════════════════════════════════════════════
    // 6. HREFLANG — diagnóstico
    // ══════════════════════════════════════════════
    $pages_to_check = [
        '/review/'      => 'Review EN',
        '/alternatives/'=> 'Alternatives EN',
        '/pricing/'     => 'Pricing EN',
    ];
    foreach ($pages_to_check as $url => $label) {
        $id = url_to_postid(home_url($url));
        if (!$id) { $log[] = "❌ {$label}: não encontrado"; continue; }
        if (function_exists('pll_get_post_translations')) {
            $tr = pll_get_post_translations($id);
            $cnt = count($tr);
            $langs = implode(', ', array_keys($tr));
            if ($cnt > 1) {
                $log[] = "✅ {$label} (ID {$id}): {$cnt} idiomas vinculados — {$langs}";
            } else {
                $log[] = "⚠️ {$label} (ID {$id}): só 1 idioma — vincule traduções no Polylang";
            }
        } else {
            $log[] = "ℹ️ {$label} (ID {$id}): Polylang não acessível neste hook";
        }
    }

    // ══════════════════════════════════════════════
    // 7. REGENERAR SITEMAP
    // ══════════════════════════════════════════════
    do_action('rank_math/sitemap/invalidate_all');
    if (class_exists('\\RankMath\\Sitemap\\Cache')) {
        \RankMath\Sitemap\Cache::invalidate_storage();
    }
    flush_rewrite_rules(false);
    $log[] = "✅ Sitemap regenerado";

    update_option('doodly_seo_fix_done_v22', true);
    update_option('doodly_seo_fix_log_v22', $log);
}

function doodly_seo_v22_notice() {
    $log = get_option('doodly_seo_fix_log_v22');
    if (!$log) return;
    $warn = array_filter($log, fn($l) => str_starts_with($l, '❌') || str_starts_with($l, '⚠️'));
    $type = $warn ? 'notice-warning' : 'notice-success';
    echo '<div class="notice ' . $type . ' is-dismissible" style="font-family:monospace;font-size:12px;padding:12px 16px">';
    echo '<p><strong>🔧 Doodly SEO Fix v2.2</strong></p>';
    echo '<ul style="margin:4px 0 8px 20px;list-style:disc">';
    foreach ($log as $l) echo '<li>' . esc_html($l) . '</li>';
    echo '</ul>';
    echo '<p><em>Desative e delete após revisar o log.</em></p></div>';
}
