<?php
/**
 * Plugin Name: Doodly Fixes v2
 * Description: Fix meta description /review/, noindex categorias confirmado, PT/ES/DE no sitemap. Deletar após usar.
 * Version: 2.0
 */

add_action('admin_init', 'doodly_fixes_v2_run');
add_action('admin_notices', 'doodly_fixes_v2_notice');

function doodly_fixes_v2_run() {
    if (get_option('doodly_fixes_v2_done')) return;
    $log = [];

    global $wpdb;

    // ══════════════════════════════════════════════
    // 1. META DESCRIPTION /review/ — busca direta SQL
    // ══════════════════════════════════════════════
    $review = $wpdb->get_row(
        "SELECT ID, post_type, post_name, post_status
         FROM {$wpdb->posts}
         WHERE post_name = 'review'
           AND post_status = 'publish'
         LIMIT 1"
    );

    if ($review) {
        $new_desc = 'Doodly Review 2026: after 30+ days of real testing — honest verdict on features, pricing, pros & cons, and whether it\'s worth buying.';
        $old_desc = get_post_meta($review->ID, 'rank_math_description', true);
        update_post_meta($review->ID, 'rank_math_description', $new_desc);
        $log[] = "✅ Review (ID {$review->ID}, type={$review->post_type}): meta description atualizada";
        $log[] = "   Antes: " . substr($old_desc ?: '(vazia)', 0, 80);
        $log[] = "   Agora: " . $new_desc;
    } else {
        // Diagnóstico: todos os posts com 'review' no slug
        $posts = $wpdb->get_results(
            "SELECT ID, post_type, post_name, post_status
             FROM {$wpdb->posts}
             WHERE post_name LIKE '%review%'
               AND post_status IN ('publish','draft')
             LIMIT 10"
        );
        $log[] = "❌ Nenhum post com slug exato 'review' publicado. Encontrados:";
        foreach ($posts as $p) {
            $log[] = "   ID={$p->ID} type={$p->post_type} slug={$p->post_name} status={$p->post_status}";
        }
    }

    // ══════════════════════════════════════════════
    // 2. NOINDEX CATEGORIAS — método direto + verificação
    // ══════════════════════════════════════════════

    // A) rank_math_titles (opção global)
    $rm = get_option('rank_math_titles', []);
    $rm['tax_category_robots']       = 'noindex,follow';
    $rm['cat_robots']                = 'noindex,follow';
    $rm['noindex_empty_taxonomies']  = 'on';
    $rm['tax_post_tag_robots']       = 'noindex,follow'; // tags também
    update_option('rank_math_titles', $rm);
    $log[] = "✅ rank_math_titles: categorias e tags = noindex,follow";

    // B) term_meta em cada categoria
    $cats = get_categories(['hide_empty' => false]);
    $count = 0;
    foreach ($cats as $cat) {
        update_term_meta($cat->term_id, 'rank_math_robots', ['noindex', 'follow']);
        update_term_meta($cat->term_id, 'rank_math_sitemap_exclude', '1');
        $count++;
    }
    $log[] = "✅ term_meta noindex + sitemap_exclude aplicado em {$count} categorias";

    // C) Verificação: lê de volta o valor
    if ($cats) {
        $sample = $cats[0];
        $val = get_term_meta($sample->term_id, 'rank_math_robots', true);
        $log[] = "🔍 Verificação cat '{$sample->name}': rank_math_robots = " . (is_array($val) ? implode(',', $val) : ($val ?: '(vazio)'));
    }

    // ══════════════════════════════════════════════
    // 3. PT/ES/DE HOMES NO SITEMAP — abordagem SQL direta
    // ══════════════════════════════════════════════
    $lang_slugs = [
        'pt' => ['inicio', 'home-pt', 'pt-home'],
        'es' => ['inicio-es', 'home-es', 'es-home'],
        'de' => ['startseite', 'home-de', 'de-home'],
    ];

    foreach ($lang_slugs as $lang => $slugs) {
        $found = null;
        foreach ($slugs as $slug) {
            $p = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT ID, post_name, post_status, post_type
                     FROM {$wpdb->posts}
                     WHERE post_name = %s
                       AND post_status = 'publish'
                     LIMIT 1",
                    $slug
                )
            );
            if ($p) { $found = $p; break; }
        }

        if (!$found) {
            // Tenta buscar pela URL da home do idioma
            $url_id = url_to_postid(home_url('/' . $lang . '/'));
            if ($url_id) {
                $found = get_post($url_id);
            }
        }

        if (!$found) {
            $log[] = "❌ [{$lang}] Página home não encontrada (slugs tentados: " . implode(', ', $slugs) . ")";

            // Lista todas as páginas do idioma via pll
            if (function_exists('pll_get_post') && function_exists('pll_languages_list')) {
                $langs = pll_languages_list(['fields' => 'slug']);
                $log[] = "   Idiomas Polylang: " . implode(', ', $langs);
            }

            // Diagnóstico: lista páginas que podem ser a home
            $candidates = $wpdb->get_results(
                "SELECT ID, post_name, post_type, post_status
                 FROM {$wpdb->posts}
                 WHERE post_type = 'page'
                   AND post_status = 'publish'
                   AND (post_name LIKE '%inicio%' OR post_name LIKE '%home%' OR post_name LIKE '%start%')
                 LIMIT 10"
            );
            foreach ($candidates as $c) {
                $pll_lang = function_exists('pll_get_post_language') ? pll_get_post_language($c->ID) : 'n/a';
                $log[] = "   Candidata: ID={$c->ID} slug={$c->post_name} lang={$pll_lang}";
            }
            continue;
        }

        $id = $found->ID;
        $pll_lang = function_exists('pll_get_post_language') ? pll_get_post_language($id) : 'n/a';

        // Remove exclusão do sitemap
        $excluded_before = get_post_meta($id, 'rank_math_sitemap_exclude', true);
        delete_post_meta($id, 'rank_math_sitemap_exclude');

        // Remove noindex se presente
        $robots = get_post_meta($id, 'rank_math_robots', true);
        if (is_array($robots) && in_array('noindex', $robots)) {
            $robots = array_values(array_diff($robots, ['noindex']));
            update_post_meta($id, 'rank_math_robots', $robots);
            $log[] = "✅ [{$lang}] ID={$id} slug={$found->post_name} lang={$pll_lang}: noindex removido, sitemap desbloqueado (era excluded={$excluded_before})";
        } else {
            $log[] = "✅ [{$lang}] ID={$id} slug={$found->post_name} lang={$pll_lang}: sitemap desbloqueado (era excluded=" . ($excluded_before ?: 'não') . ")";
        }
    }

    // ══════════════════════════════════════════════
    // 4. RANK MATH SITEMAP — forçar inclusão de páginas
    // ══════════════════════════════════════════════
    $rm_sitemap = get_option('rank_math_sitemap', []);
    // Garante que pages estão habilitadas no sitemap
    $rm_sitemap['pt_post_sitemap']  = isset($rm_sitemap['pt_post_sitemap'])  ? $rm_sitemap['pt_post_sitemap']  : 'on';
    $rm_sitemap['pt_page_sitemap']  = 'on';
    update_option('rank_math_sitemap', $rm_sitemap);

    // ══════════════════════════════════════════════
    // 5. LIMPAR CACHE
    // ══════════════════════════════════════════════
    do_action('rank_math/sitemap/invalidate_all');
    if (class_exists('\\RankMath\\Sitemap\\Cache')) {
        \RankMath\Sitemap\Cache::invalidate_storage();
    }
    // LiteSpeed Cache
    if (class_exists('\\LiteSpeed\\Purge')) {
        \LiteSpeed\Purge::purge_all();
    }
    do_action('litespeed_purge_all');
    flush_rewrite_rules(false);
    $log[] = "✅ Cache limpo, sitemap regenerado";

    update_option('doodly_fixes_v2_done', true);
    update_option('doodly_fixes_v2_log', $log);
}

function doodly_fixes_v2_notice() {
    $log = get_option('doodly_fixes_v2_log');
    if (!$log) return;
    $warn = array_filter($log, fn($l) => str_starts_with($l, '❌') || str_starts_with($l, '⚠️'));
    $type = $warn ? 'notice-warning' : 'notice-success';
    echo '<div class="notice ' . $type . ' is-dismissible" style="font-family:monospace;font-size:11px;padding:12px 16px;max-height:500px;overflow:auto">';
    echo '<p><strong>🔧 Doodly Fixes v2.0</strong></p>';
    echo '<ul style="margin:4px 0 8px 20px;list-style:disc">';
    foreach ($log as $l) echo '<li>' . esc_html($l) . '</li>';
    echo '</ul>';
    echo '<p><em>Desative e delete após revisar.</em></p></div>';
}
