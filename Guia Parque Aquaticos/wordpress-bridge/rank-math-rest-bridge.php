<?php
/**
 * Plugin Name: Guia Parques Aquáticos - REST Bridge
 * Description: Expõe metacampos do Rank Math na REST API, injeta CSS do design system e aplica correções de SEO.
 * Version: 2.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// ── 1. Rank Math meta fields via REST ──────────────────────────────────────

add_action(
	'init',
	function () {
		$meta_keys = array(
			'rank_math_title'            => 'string',
			'rank_math_description'      => 'string',
			'rank_math_focus_keyword'    => 'string',
			'rank_math_schema_type'      => 'string',
			'rank_math_robots'           => 'string',
			'rank_math_canonical_url'    => 'string',
		);

		foreach ( array( 'page', 'post' ) as $post_type ) {
			foreach ( $meta_keys as $meta_key => $meta_type ) {
				register_post_meta(
					$post_type,
					$meta_key,
					array(
						'single'        => true,
						'type'          => $meta_type,
						'show_in_rest'  => true,
						'auth_callback' => function () {
							return current_user_can( 'edit_pages' );
						},
					)
				);
			}
		}
	}
);

// ── 2. 42Flows custom meta fields ─────────────────────────────────────────

add_action(
	'init',
	function () {
		$flows_keys = array(
			'_42flows_delivered' => 'string',
			'_42flows_schemas'   => 'string',
		);

		foreach ( array( 'page', 'post' ) as $post_type ) {
			foreach ( $flows_keys as $meta_key => $meta_type ) {
				register_post_meta(
					$post_type,
					$meta_key,
					array(
						'single'        => true,
						'type'          => $meta_type,
						'show_in_rest'  => true,
						'auth_callback' => function () {
							return current_user_can( 'edit_posts' );
						},
					)
				);
			}
		}
	}
);

// ── 3. REST endpoint: update Rank Math og:site_name ───────────────────────

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'42flows/v1',
			'/rank-math-settings',
			array(
				'methods'             => 'POST',
				'callback'            => function ( WP_REST_Request $request ) {
					$settings = get_option( 'rank_math_general_settings', array() );
					$updated  = false;

					if ( $request->has_param( 'website_name' ) ) {
						$settings['website_name'] = sanitize_text_field( $request->get_param( 'website_name' ) );
						$updated = true;
					}

					if ( $updated ) {
						update_option( 'rank_math_general_settings', $settings );
					}

					return array( 'success' => true, 'settings' => $settings );
				},
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}
);

// ── 4. Hide WordPress version ─────────────────────────────────────────────

remove_action( 'wp_head', 'wp_generator' );

add_filter( 'the_generator', '__return_empty_string' );

// ── 5. Disable Contact Form 7 CSS/JS on pages without CF7 shortcode ──────

add_action(
	'wp_enqueue_scripts',
	function () {
		if ( ! is_singular() ) {
			return;
		}

		global $post;
		if ( ! isset( $post->post_content ) ) {
			return;
		}

		$has_cf7 = (
			has_shortcode( $post->post_content, 'contact-form-7' ) ||
			has_shortcode( $post->post_content, 'cf7' )
		);

		if ( ! $has_cf7 ) {
			wp_dequeue_style( 'contact-form-7' );
			wp_dequeue_script( 'contact-form-7' );
		}
	},
	20
);

// ── 6. Remove xmlrpc pingback header ─────────────────────────────────────

add_filter( 'wp_headers', function ( $headers ) {
	unset( $headers['X-Pingback'] );
	return $headers;
} );

remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'wlwmanifest_link' );
