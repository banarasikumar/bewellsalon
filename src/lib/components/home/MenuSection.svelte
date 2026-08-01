<script lang="ts">
	import { appSettings } from '$lib/stores/appSettings';
	import { Download } from 'lucide-svelte';

	let menuWidgetEnabled = $derived($appSettings?.menuWidgetEnabled ?? true);
	let menuImageEnabled = $derived($appSettings?.menuImageEnabled ?? true);
	let menuPdfEnabled = $derived($appSettings?.menuPdfEnabled ?? true);
</script>

{#if menuWidgetEnabled && (menuImageEnabled || menuPdfEnabled)}
	<section class="container menu-section">
		{#if menuImageEnabled && $appSettings?.menuImageUrl}
			<div class="section-header">
				<h2>Salon Menu</h2>
				<p>Explore our complete range of services</p>
			</div>

			<div class="menu-image-container">
				<img src={$appSettings?.menuImageUrl} alt="Salon Menu" class="menu-image" />
			</div>
		{/if}

		{#if menuPdfEnabled && $appSettings?.menuPdfUrl}
			<div class="download-container">
				<a href={$appSettings.menuPdfUrl} download="Salon_Menu.pdf" class="download-btn" target="_blank" rel="noopener noreferrer">
					<span class="btn-content">
						<Download size="20" class="icon" />
						<span class="text">Download Complete Menu</span>
					</span>
				</a>
			</div>
		{/if}
	</section>
{/if}

<style>
	.menu-section {
		padding-top: 40px;
		padding-bottom: 40px;
		text-align: center;
	}

	.section-header {
		margin-bottom: 24px;
	}

	.section-header h2 {
		font-size: 1.5rem;
		background: var(--gradient-gold);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		display: inline-block;
		margin-bottom: 4px;
	}

	.section-header p {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}

	.menu-image-container {
		margin: 0 auto 24px;
		max-width: 800px;
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
		border: 1px solid rgba(212, 175, 55, 0.2);
	}

	.menu-image {
		width: 100%;
		height: auto;
		display: block;
		object-fit: contain;
	}

	.download-container {
		display: flex;
		justify-content: center;
	}

	.download-btn {
		display: inline-block;
		background: var(--gradient-gold);
		border-radius: var(--radius-full);
		padding: 14px 28px;
		text-decoration: none;
		color: #000;
		font-weight: 700;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
	}

	.download-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
	}

	.btn-content {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.text {
		font-size: 1rem;
	}
</style>
