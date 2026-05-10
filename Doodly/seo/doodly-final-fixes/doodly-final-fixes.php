<?php
/**
 * Plugin Name: Doodly Final SEO Fixes
 * Description: Noindex categorias (abordagem direta), meta description review, diagnóstico PT/ES/DE sitemap.
 * Version: 1.0
 */

add_action('admin_init', 'doodly_final_fixes_run');
add_action('admin_notices', 'doodly_final_fixes_notice');

function doodly_final_fixes_run() {
    if (get_option('doodly_final_fixes_done_v10')) return;
    $log = [];

    // ══════════════════════════════════════════════
    // 1. NOINDEX CATEGORIAS — abordagem tripla
    // ══════════════════════════════════════════════

    // A) rank_math_titles — formato correto do Rank Math
    $rm = get_option('rank_math_titles', []);
    $rm['tax_category_robots']  = 'noindex,follow';
    $rm['cat_robots']           = 'noindex,follow';
    $rm['noindex_empty_taxonomies'] = 'on';
    update_option('rank_math_titles', $rm);
    $log[] = "✅ rank_math_titles: tax_category_robots = noindex,follow";

    // B) term_meta em cada categoria
    $cats = get_categories(['hide_empty' => false]);
    $count = 0;
    foreach ($cats as $cat) {
        // Rank Math lê term_meta como array ['noindex', 'follow']
        update_term_meta($cat->term_id, 'rank_math_robots', ['noindex', 'follow']);
        $count++;
    }
    $log[] = "✅ term_meta noindex aplicado em {$count} categorias";

    // C) Rank Math Sitemap — excluir categoria do sitemap via opção do módulo
    $rm_sitemap = get_option('rank_math_sitemap', []);
    // Rank Math usa 'tax_category_sitemap' para controlar inclusão no sitemap
    $rm_sitemap['tax_category_sitemap'] = 'off';
    update_option('rank_math_sitemap', $rm_sitemap);

    // Também tenta via rank_math_general
    $rm_general = get_option('rank_math_general', []);
    update_option('rank_math_general', $rm_general);
    $log[] = "✅ rank_math_sitemap: tax_category_sitemap = off";

    // ══════════════════════════════════════════════
    // 2. META DESCRIPTION — Review EN (ID direto)
    // ══════════════════════════════════════════════
    $review_id = url_to_postid(home_url('/review/'));

    // Fallback: busca por slug em todos os post types registrados
    if (!$review_id) {
        $all_types = get_post_types(['public' => true]);
        foreach ($all_types as $type) {
            $q = new WP_Query([
                'post_type'      => $type,
                'name'           => 'review',
                'post_status'    => 'publish',
                'posts_per_page' => 1,
                'suppress_filters' => true,
            ]);
            if ($q->have_posts()) {
                $review_id = $q->posts[0]->ID;
                break;
            }
        }
    }

    if ($review_id) {
        $desc = 'Doodly Review 2026: after 30+ days of real testing — honest verdict on features, pricing, pros & cons, and whether it\'s worth buying.';
        update_post_meta($review_id, 'rank_math_description', $desc);
        $log[] = "✅ Review EN (ID {$review_id}) — meta description atualizada";
        $log[] = "   → " . $desc;
    } else {
        // Log todos os posts públicos para diagnóstico
        global $wpdb;
        $posts = $wpdb->get_results(
            "SELECT ID, post_type, post_name, post_status
             FROM {$wpdb->posts}
             WHERE post_name LIKE '%review%' AND post_status = 'publish'
             LIMIT 10"
        );
        $log[] = "❌ /review/ não encontrado. Posts com 'review' no slug:";
        foreach ($posts as $p) {
            $log[] = "   ID={$p->ID} type={$p->post_type} slug={$p->post_name}";
        }
    }

    // ══════════════════════════════════════════════
    // 3. DIAGNÓSTICO — PT/ES/DE homes no sitemap
    // ══════════════════════════════════════════════
    $lang_slugs = ['inicio' => 'pt', 'inicio-es' => 'es', 'startseite' => 'de'];
    foreach ($lang_slugs as $slug => $lang) {
        $q = new WP_Query([
            'post_type'        => 'page',
            'name'             => $slug,
            'post_status'      => 'publish',
            'posts_per_page'   => 1,
            'suppress_filters' => true, // ignora Polylang
        ]);
        if (!$q->have_posts()) {
            $log[] = "❌ [{$lang}] página '{$slug}' não encontrada mesmo sem filtros";
            continue;
        }
        $id = $q->posts[0]->ID;
        $excluded    = get_post_meta($id, 'rank_math_sitemap_exclude', true);
        $robots      = get_post_meta($id, 'rank_math_robots', true);
        $polylang_lang = function_exists('pll_get_post_language') ? pll_get_post_language($id) : 'n/a';

        // Remove exclusão e noindex
        delete_post_meta($id, 'rank_math_sitemap_exclude');
        if (is_array($robots) && in_array('noindex', $robots)) {
            update_post_meta($id, 'rank_math_robots', array_values(array_diff($robots, ['noindex'])));
        }

        $log[] = "🔍 [{$lang}] ID={$id} slug={$slug} lang={$polylang_lang}"
               . " excluded=" . ($excluded ?: 'não') . " robots=" . (is_array($robots) ? implode(',', $robots) : ($robots ?: 'nenhum'));
    }

    // ══════════════════════════════════════════════
    // 4. REGENERAR SITEMAP
    // ══════════════════════════════════════════════
    do_action('rank_math/sitemap/invalidate_all');
    if (class_exists('\\RankMath\\Sitemap\\Cache')) {
        \RankMath\Sitemap\Cache::invalidate_storage();
    }
    flush_rewrite_rules(false);
    $log[] = "✅ Sitemap invalidado e regenerado";

    update_option('doodly_final_fixes_done_v10', true);
    update_option('doodly_final_fixes_log_v10', $log);
}

function doodly_final_fixes_notice() {
    $log = get_option('doodly_final_fixes_log_v10');
    if (!$log) return;
    $warn = array_filter($log, fn($l) => str_starts_with($l, '❌') || str_starts_with($l, '⚠️'));
    $type = $warn ? 'notice-warning' : 'notice-success';
    echo '<div class="notice ' . $type . ' is-dismissible" style="font-family:monospace;font-size:11px;padding:12px 16px">';
    echo '<p><strong>🔧 Doodly Final SEO Fixes v1.0</strong></p>';
    echo '<ul style="margin:4px 0 8px 20px;list-style:disc">';
    foreach ($log as $l) echo '<li>' . esc_html($l) . '</li>';
    echo '</ul>';
    echo '<p><em>Desative e delete após revisar.</em></p></div>';
}
