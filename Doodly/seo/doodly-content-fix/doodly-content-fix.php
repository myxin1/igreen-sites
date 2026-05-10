<?php
/**
 * Plugin Name: Doodly Content Fix
 * Description: Remove botões e teasers duplicados nas 4 homes. Desative e delete após rodar.
 * Version: 1.2
 */

add_action('admin_init', 'doodly_content_fix_run');
add_action('admin_notices', 'doodly_content_fix_notice');

function doodly_content_fix_run() {
    if (get_option('doodly_content_fix_done_v12')) return;

    $log = [];

    $homes = [
        'en' => (int) get_option('page_on_front'),
        'pt' => doodly_cf_get_page('inicio'),
        'es' => doodly_cf_get_page('inicio-es'),
        'de' => doodly_cf_get_page('startseite'),
    ];

    // ── Botões a REMOVER totalmente (texto exato confirmado no site ao vivo) ──
    $remove_buttons = [
        'en' => [
            'Read the Full Doodly Review',
            'Read the full Doodly Review',
        ],
        'pt' => [
            'Ler o Review Completo do Doodly',
        ],
        'es' => [
            'Leer el Review Completo de Doodly',  // texto real encontrado no site
            'Leer la Reseña Completa de Doodly',
            'Lee el Review Completo de Doodly',
        ],
        'de' => [
            'Den vollständigen Doodly Review lesen',
        ],
    ];

    // ── Botões a RENOMEAR (que ficam) ──
    $rename_buttons = [
        'en' => ['Read Full Review'       => 'Read Doodly Review'],
        'pt' => ['Ler Review Completo'    => 'Ler Doodly Review'],
        'es' => ['Leer Reseña Completa'   => 'Leer Doodly Review'],
        'de' => ['Zum vollständigen Test' => 'Doodly Test lesen'],
    ];

    // ── Início do teaser para detectar duplicatas ──
    $teaser_anchors = [
        'en' => 'Wondering if Doodly is worth it',
        'pt' => 'Vale a pena investir no Doodly',
        'es' => 'Vale la pena el Doodly',
        'de' => 'Lohnt sich Doodly',
    ];

    foreach ($homes as $lang => $id) {
        if (!$id) { $log[] = "❌ [{$lang}] ID não encontrado"; continue; }

        $content  = get_post_field('post_content', $id);
        $original = $content;

        // 1. Remover TODAS as ocorrências dos botões indesejados
        foreach (($remove_buttons[$lang] ?? []) as $btn_text) {
            $esc = preg_quote($btn_text, '~');
            // Remove <a ...> Texto (seta opcional) </a>  — qualquer classe
            $content = preg_replace(
                '~<a[^>]+>\s*' . $esc . '\s*(?:→|&rarr;|&#8594;|&#x2192;)?\s*</a>~u',
                '',
                $content
            );
        }

        // 2. Remover <p> vazios que sobraram
        $content = preg_replace('~<p[^>]*>\s*(&nbsp;|\s)*</p>~u', '', $content);

        // 3. Remover teaser duplicado (remove PRIMEIRA ocorrência, mantém a segunda)
        if (!empty($teaser_anchors[$lang])) {
            $anchor = $teaser_anchors[$lang];
            // Conta quantas vezes o parágrafo aparece
            $count = substr_count($content, $anchor);
            if ($count > 1) {
                $esc = preg_quote($anchor, '~');
                // Remove o primeiro <p>...</p> que contém o anchor
                // O padrão cobre parágrafos com e sem tags internas (ex: <strong>)
                $content = preg_replace(
                    '~<p[^>]*>(?:[^<]|<(?!/?p)[^>]*>)*?' . $esc . '(?:[^<]|<(?!/?p)[^>]*>)*?</p>~us',
                    '',
                    $content,
                    1   // ← limit=1: remove só a primeira ocorrência
                );
                $log[] = "✅ [{$lang}] Teaser duplicado removido";
            }
        }

        // 4. Renomear o botão que fica
        foreach (($rename_buttons[$lang] ?? []) as $from => $to) {
            $content = str_replace('>' . $from . ' →<', '>' . $to . ' →<', $content);
            $content = str_replace('>' . $from . '<',   '>' . $to . '<',   $content);
        }

        if ($content !== $original) {
            wp_update_post(['ID' => $id, 'post_content' => $content]);
            $log[] = "✅ [{$lang}] Conteúdo atualizado (ID {$id})";
        } else {
            $log[] = "ℹ️ [{$lang}] Sem alterações necessárias";
        }
    }

    update_option('doodly_content_fix_done_v12', true);
    update_option('doodly_content_fix_log_v12', $log);
}

function doodly_cf_get_page($slug) {
    $q = new WP_Query(['post_type'=>'page','name'=>$slug,'post_status'=>'publish','posts_per_page'=>1]);
    return $q->have_posts() ? $q->posts[0]->ID : 0;
}

function doodly_content_fix_notice() {
    $log = get_option('doodly_content_fix_log_v12');
    if (!$log) return;
    echo '<div class="notice notice-success is-dismissible" style="font-family:monospace;font-size:12px;padding:12px 16px">';
    echo '<p><strong>Doodly Content Fix v1.2</strong></p>';
    echo '<ul style="margin:4px 0 8px 20px;list-style:disc">';
    foreach ($log as $line) echo '<li>' . esc_html($line) . '</li>';
    echo '</ul>';
    echo '<p><strong>✅ Desative e delete este plugin.</strong></p></div>';
}
