<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { appSettings } from '$lib/stores/appSettings';

	// Reactive active offers from the database (filter out disabled cards)
	const offers = $derived(($appSettings.specialOffers || []).filter((o: any) => o.enabled !== false));

	let visible = $state(false);

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					visible = true;
					observer.disconnect();
				}
			},
			{ threshold: 0.2 }
		);

		const section = document.querySelector('.offers-section');
		if (section) observer.observe(section);
	});
</script>

<section id="special-offers" class="offers-section container section-padding">
	<div class="section-header">
		<h2 class="section-title">
			<span class="title-decoration">✨</span>
			Special Offers
			<span class="title-decoration">✨</span>
		</h2>
		<p class="section-subtitle">Limited time deals just for you</p>
	</div>

	<div class="offers-grid">
		{#if visible}
			{#each offers as offer, i}
				{@const hasFullBg = (offer.mediaType === 'image' || offer.image || (offer.icon && offer.icon.startsWith('http'))) && offer.mediaType !== 'emoji'}
				{@const bgUrl = offer.image || (offer.icon && offer.icon.startsWith('http') ? offer.icon : '')}

				<div
					class="offer-card glow-card {hasFullBg ? 'has-full-cover' : ''}"
					style={hasFullBg ? `background-image: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%), url('${bgUrl}'); background-size: cover; background-position: center;` : ''}
					in:fly={{ y: 50, duration: 800, delay: i * 200 }}
				>
					{#if offer.badge && offer.badge.trim()}
						<div class="offer-badge {i === 0 ? 'hot' : i === 1 ? 'festive' : 'student'}">{offer.badge}</div>
					{/if}
					
					{#if !hasFullBg && offer.icon && offer.icon.trim()}
						<div class="offer-icon">
							{offer.icon}
						</div>
					{/if}

					{#if offer.title && offer.title.trim()}
						<h3>{offer.title}</h3>
					{/if}

					{#if offer.desc && offer.desc.trim()}
						<p>{offer.desc}</p>
					{/if}

					{#if (offer.oldPrice && offer.oldPrice.trim()) || (offer.newPrice && offer.newPrice.trim())}
						<div class="offer-price">
							{#if offer.oldPrice && offer.oldPrice.trim()}
								<span class="old-price">{offer.oldPrice}</span>
							{/if}
							{#if offer.newPrice && offer.newPrice.trim()}
								<span class="new-price">{offer.newPrice}</span>
							{/if}
						</div>
					{/if}

					<div class="sparkle-line"></div>
					<button class="tc-btn">T&C</button>
				</div>
			{/each}
		{/if}
	</div>
</section>

<style>
	.offers-section {
		scroll-margin-top: 60px;
	}

	.section-padding {
		padding-top: 60px;
		padding-bottom: 60px;
	}

	.section-header {
		text-align: center;
		margin-bottom: 40px;
	}

	.section-title {
		font-size: 2rem;
		margin-bottom: 8px;
		background: var(--gradient-gold);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		display: inline-flex;
		align-items: center;
		gap: 10px;
	}

	.title-decoration {
		font-size: 1.5rem;
		-webkit-text-fill-color: initial; /* Keep emoji colors */
	}

	.section-subtitle {
		color: var(--color-text-secondary);
		font-size: 1rem;
	}

	.offers-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 20px;
	}

	.offer-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-lg);
		padding: 24px;
		position: relative;
		overflow: hidden;
		text-align: center;
		transition:
			transform var(--transition-bounce),
			box-shadow var(--transition-smooth);
		backdrop-filter: blur(10px);
	}

	.offer-card.has-full-cover {
		min-height: 280px;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		text-align: left;
		padding: 24px;
	}

	.offer-card.has-full-cover h3 {
		color: #ffffff;
		text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
	}

	.offer-card.has-full-cover p {
		color: rgba(255, 255, 255, 0.9);
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
	}

	.offer-card:hover {
		transform: translateY(-5px);
		border-color: var(--color-accent-gold);
		box-shadow: var(--shadow-gold);
	}

	.offer-badge {
		position: absolute;
		top: 15px;
		right: 15px;
		font-size: 0.7rem;
		font-weight: 700;
		padding: 4px 10px;
		border-radius: var(--radius-full);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.offer-badge.hot {
		background: #ff4d4d;
		color: white;
		box-shadow: 0 2px 10px rgba(255, 77, 77, 0.4);
	}

	.offer-badge.festive {
		background: var(--color-accent-gold);
		color: black;
		box-shadow: 0 2px 10px rgba(212, 175, 55, 0.4);
	}

	.offer-badge.student {
		background: #4d94ff;
		color: white;
		box-shadow: 0 2px 10px rgba(77, 148, 255, 0.4);
	}

	.offer-icon {
		font-size: 2.5rem;
		margin-bottom: 15px;
		display: inline-block;
	}

	.offer-img-icon {
		width: 48px;
		height: 48px;
		object-fit: contain;
		margin-bottom: 15px;
	}

	.offer-card h3 {
		font-size: 1.2rem;
		margin-bottom: 8px;
		color: var(--color-text-primary);
	}

	.offer-card p {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin-bottom: 20px;
	}

	.offer-price {
		margin-bottom: 15px;
		font-family: var(--font-heading);
	}

	.old-price {
		text-decoration: line-through;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		margin-right: 8px;
		opacity: 0.7;
	}

	.new-price {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-accent-gold);
	}

	.sparkle-line {
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--color-accent-gold), transparent);
		margin: 15px 0;
		opacity: 0.5;
	}

	.tc-btn {
		position: absolute;
		bottom: 12px;
		right: 12px;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		color: rgba(255, 255, 255, 0.85);
		font-size: 0.75rem;
		font-weight: 700;
		padding: 3px 10px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: var(--radius-full);
		transition: all 0.2s;
		z-index: 3;
	}

	.tc-btn:hover {
		background: rgba(212, 175, 55, 0.25);
		border-color: var(--color-accent-gold);
		color: #ffffff;
	}
</style>
