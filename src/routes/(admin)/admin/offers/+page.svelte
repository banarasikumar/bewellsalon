<script lang="ts">
	import { appSettings, updateAppSetting } from '$lib/stores/appSettings';
	import { showToast } from '$lib/stores/toast';
	import { Save, Tag, RefreshCw, AlertCircle, Image as ImageIcon, Sparkles, TrendingUp } from 'lucide-svelte';

	let savingTicker = $state(false);
	let savingOffers = $state([false, false, false]);

	let localTickerText = $state($appSettings.promoTickerText || '');
	let localOffers = $state(
		$appSettings.specialOffers
			? JSON.parse(JSON.stringify($appSettings.specialOffers))
			: [
					{ id: 1, badge: '', icon: '', title: '', desc: '', oldPrice: '', newPrice: '' },
					{ id: 2, badge: '', icon: '', title: '', desc: '', oldPrice: '', newPrice: '' },
					{ id: 3, badge: '', icon: '', title: '', desc: '', oldPrice: '', newPrice: '' }
				]
	);

	$effect(() => {
		if (!savingTicker && !savingOffers.includes(true) && $appSettings.specialOffers) {
			localTickerText = $appSettings.promoTickerText || '';
			localOffers = JSON.parse(JSON.stringify($appSettings.specialOffers));
		}
	});

	async function saveTicker() {
		if (savingTicker) return;
		savingTicker = true;
		const success = await updateAppSetting('promoTickerText', localTickerText);
		if (success) {
			showToast('Promo Ticker updated successfully!', 'success');
		} else {
			showToast('Failed to update ticker.', 'error');
		}
		savingTicker = false;
	}

	async function saveOffer(index: number) {
		if (savingOffers[index]) return;
		savingOffers[index] = true;
		
		// The store expects all offers together, so we save the whole array,
		// but the UI gives the impression of saving individually (which is safer anyway).
		const success = await updateAppSetting('specialOffers', localOffers);
		
		if (success) {
			showToast(`Offer ${index + 1} updated successfully!`, 'success');
		} else {
			showToast(`Failed to update Offer ${index + 1}.`, 'error');
		}
		
		savingOffers[index] = false;
	}

	function resetChanges() {
		localTickerText = $appSettings.promoTickerText || '';
		localOffers = JSON.parse(JSON.stringify($appSettings.specialOffers));
		showToast('Reverted to live values.', 'info');
	}
</script>

<svelte:head>
	<title>Manage Offers - BeWell Admin</title>
</svelte:head>

<div class="admin-page offers-page">
	<div class="page-header">
		<div>
			<h1 class="page-title">
				<div class="icon-wrapper">
					<Tag size="24" color="#fff" />
				</div>
				Offer Management
			</h1>
			<p class="page-subtitle">Control the homepage promotions instantly across all devices.</p>
		</div>
		<button class="btn btn-outline" onclick={resetChanges}>
			<RefreshCw size="18" />
			Sync Live Data
		</button>
	</div>

	<!-- PROMO TICKER SECTION -->
	<div class="glass-section promo-section">
		<div class="section-header">
			<div class="header-left">
				<Sparkles size="22" class="accent-icon purple" />
				<div>
					<h2>Scrolling Promo Ticker</h2>
					<p>The scrolling marquee banner displayed at the very top of the app.</p>
				</div>
			</div>
			<button class="btn btn-primary" onclick={saveTicker} disabled={savingTicker}>
				{#if savingTicker}
					<div class="spinner"></div>
				{:else}
					<Save size="16" />
					Update Ticker
				{/if}
			</button>
		</div>
		
		<div class="input-container">
			<textarea 
				class="premium-input" 
				rows="2" 
				bind:value={localTickerText}
				placeholder="Enter the exciting promo text here..."
			></textarea>
		</div>
	</div>

	<!-- SPECIAL OFFERS TITLE -->
	<div class="offers-title-area">
		<TrendingUp size="22" class="accent-icon gold" />
		<h2>Featured Offer Cards</h2>
	</div>

	<!-- SPECIAL OFFERS GRID -->
	<div class="offers-grid">
		{#each localOffers as offer, i}
			<div class="glass-card offer-card">
				<div class="card-top-bar">
					<div class="card-badge">Card {i + 1}</div>
					<button class="btn btn-sm btn-save" onclick={() => saveOffer(i)} disabled={savingOffers[i]}>
						{#if savingOffers[i]}
							<div class="spinner small"></div>
						{:else}
							<Save size="14" />
							Save Card
						{/if}
					</button>
				</div>

				<div class="card-body">
					<div class="form-row">
						<div class="form-group flex-2">
							<label>Headline Title</label>
							<input type="text" class="premium-input" bind:value={offer.title} placeholder="e.g. Festive Special" />
						</div>
						<div class="form-group flex-1">
							<label>Top Badge</label>
							<input type="text" class="premium-input" bind:value={offer.badge} placeholder="HOT DEAL" />
						</div>
					</div>

					<div class="form-group">
						<label>Description Text</label>
						<input type="text" class="premium-input" bind:value={offer.desc} placeholder="Write a short exciting description..." />
					</div>

					<div class="form-row">
						<div class="form-group flex-1">
							<label>Icon (Emoji or URL)</label>
							<div class="input-with-icon">
								<ImageIcon size="16" class="inside-icon" />
								<input type="text" class="premium-input indented" bind:value={offer.icon} placeholder="✂️ or https://..." />
							</div>
						</div>
						<div class="form-group flex-1">
							<label>Old Price (Optional)</label>
							<input type="text" class="premium-input strike" bind:value={offer.oldPrice} placeholder="$150 or 20% OFF" />
						</div>
						<div class="form-group flex-1">
							<label>New Price</label>
							<input type="text" class="premium-input highlight" bind:value={offer.newPrice} placeholder="$99 or FREE" />
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.offers-page {
		padding: 32px 24px;
		max-width: 1100px;
		margin: 0 auto;
		animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 40px;
	}

	.page-title {
		display: flex;
		align-items: center;
		gap: 16px;
		font-family: var(--font-heading);
		font-size: 32px;
		font-weight: 700;
		color: var(--admin-text-primary);
		margin-bottom: 8px;
		letter-spacing: -0.5px;
	}

	.icon-wrapper {
		background: linear-gradient(135deg, var(--admin-accent), var(--admin-orange, #f59e0b));
		width: 48px;
		height: 48px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 16px var(--admin-accent-light);
	}

	.page-subtitle {
		color: var(--admin-text-secondary);
		font-size: 16px;
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 24px;
		border-radius: 12px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.btn-primary {
		background: var(--admin-accent);
		color: #fff;
		border: none;
		box-shadow: 0 4px 12px var(--admin-accent-light);
	}

	.btn-primary:hover:not(:disabled) {
		filter: brightness(1.1);
		transform: translateY(-2px);
		box-shadow: 0 8px 20px var(--admin-accent-light);
	}

	.btn-save {
		background: var(--admin-green-light);
		color: var(--admin-green);
		border: 1px solid var(--admin-green);
	}

	.btn-save:hover:not(:disabled) {
		background: var(--admin-green);
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 6px 16px var(--admin-green-light);
	}

	.btn-outline {
		background: var(--admin-surface);
		color: var(--admin-text-primary);
		border: 1px solid var(--admin-border);
	}

	.btn-outline:hover:not(:disabled) {
		background: var(--admin-surface-hover);
		border-color: var(--admin-text-secondary);
	}

	.btn-sm {
		padding: 6px 16px;
		font-size: 13px;
		border-radius: 8px;
	}

	/* Glass Sections */
	.glass-section {
		background: var(--admin-surface);
		border: 1px solid var(--admin-border);
		border-radius: 20px;
		padding: 28px;
		margin-bottom: 40px;
		box-shadow: var(--admin-shadow-md);
		position: relative;
		overflow: hidden;
	}

	.glass-card {
		background: var(--admin-surface);
		border: 1px solid var(--admin-border);
		border-radius: 16px;
		padding: 24px;
		box-shadow: var(--admin-shadow-sm);
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.glass-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--admin-shadow-md);
		border-color: var(--admin-accent);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.header-left {
		display: flex;
		align-items: flex-start;
		gap: 16px;
	}

	.accent-icon {
		padding: 10px;
		border-radius: 12px;
		margin-top: 2px;
	}
	.accent-icon.purple {
		background: var(--admin-purple-light);
		color: var(--admin-purple);
	}
	.accent-icon.gold {
		background: var(--admin-accent-light);
		color: var(--admin-accent);
	}

	.section-header h2 {
		font-family: var(--font-heading);
		font-size: 20px;
		font-weight: 600;
		color: var(--admin-text-primary);
		margin-bottom: 4px;
	}

	.section-header p {
		color: var(--admin-text-secondary);
		font-size: 14px;
	}

	/* Inputs */
	.premium-input {
		width: 100%;
		padding: 14px 16px;
		background: var(--admin-bg);
		border: 1.5px solid var(--admin-border);
		border-radius: 12px;
		color: var(--admin-text-primary);
		font-size: 15px;
		font-family: var(--font-body);
		transition: all 0.2s ease;
	}

	.premium-input:focus {
		outline: none;
		background: var(--admin-surface);
		border-color: var(--admin-accent);
		box-shadow: 0 0 0 4px var(--admin-accent-light);
	}

	textarea.premium-input {
		resize: none;
		min-height: 70px;
		line-height: 1.5;
	}

	.input-with-icon {
		position: relative;
		display: flex;
		align-items: center;
	}

	.inside-icon {
		position: absolute;
		left: 14px;
		color: var(--admin-text-secondary);
	}

	.premium-input.indented {
		padding-left: 42px;
	}

	.premium-input.highlight {
		color: var(--admin-orange);
		font-weight: 600;
		background: var(--admin-orange-light);
	}
	.premium-input.highlight:focus {
		border-color: var(--admin-orange);
		box-shadow: 0 0 0 4px var(--admin-orange-light);
	}

	.premium-input.strike {
		color: var(--admin-text-secondary);
	}

	/* Form Layouts */
	.offers-title-area {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 24px;
	}

	.offers-title-area h2 {
		font-family: var(--font-heading);
		font-size: 22px;
		font-weight: 600;
		color: var(--admin-text-primary);
	}

	.offers-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
	}

	.card-top-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--admin-border);
	}

	.card-badge {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: var(--admin-text-primary);
		background: var(--admin-bg);
		padding: 4px 10px;
		border-radius: 8px;
		border: 1px solid var(--admin-border);
	}

	.form-row {
		display: flex;
		gap: 16px;
		margin-bottom: 16px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
	}

	.form-group.flex-1 { flex: 1; }
	.form-group.flex-2 { flex: 2; }

	.form-group label {
		font-size: 13px;
		font-weight: 600;
		color: var(--admin-text-secondary);
	}

	/* Loaders */
	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid var(--admin-text-primary);
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	.spinner.small {
		width: 14px;
		height: 14px;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@keyframes slideUp {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@media (max-width: 768px) {
		.form-row {
			flex-direction: column;
			gap: 0;
		}
		.section-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 16px;
		}
		.section-header .btn {
			width: 100%;
		}
	}
</style>
