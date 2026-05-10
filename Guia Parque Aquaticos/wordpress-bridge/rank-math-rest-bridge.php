<?php
/**
 * Plugin Name: Guia Parques Aquaticos - Rank Math REST Bridge
 * Description: Expoe metacampos do Rank Math na REST API para permitir automacao externa.
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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
						'single'       => true,
						'type'         => $meta_type,
						'show_in_rest' => true,
						'auth_callback' => function () {
							return current_user_can( 'edit_pages' );
						},
					)
				);
			}
		}
	}
);
