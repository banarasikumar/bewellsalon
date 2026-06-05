<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	// Data for offers
	const offers = [
		{
			id: 1,
			badge: 'HOT DEAL',
			badgeClass: 'hot',
			icon: '✂️',
			title: 'Haircuts Starting @ ₹299',
			description: 'Get premium haircut styles starting at just ₹299! Limited time offer.',
			oldPrice: '₹400-600',
			newPrice: '₹299',
			discount: null
		},
		{
			id: 2,
			badge: 'FESTIVE SPECIAL',
			badgeClass: 'festive',
			icon: '🪔',
			title: 'Festive Beauty Package',
			description: '15% off* prices are inclusive of the offer',
			oldPrice: null,
			newPrice: '15% OFF*',
			discount: null
		},
		{
			id: 3,
			badge: 'STUDENT OFFER',
			badgeClass: 'student',
			icon: '🎓',
			title: 'College Student Discount',
			description: 'Get 15% off on all services with valid student ID',
			oldPrice: null,
			newPrice: '15% OFF',
			discount: null
		}
	];

	let visible = false;

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

<section class="offers-section container section-padding">
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
				<div class="offer-card glow-card" in:fly={{ y: 50, duration: 800, delay: i * 200 }}>
					<div class="offer-badge {offer.badgeClass}">{offer.badge}</div>
					<div class="offer-icon">{offer.icon}</div>
					<h3>{offer.title}</h3>
					<p>{offer.description}</p>
					<div class="offer-price">
						{#if offer.oldPrice}
							<span class="old-price">{offer.oldPrice}</span>
						{/if}
						<span class="new-price">{offer.newPrice}</span>
					</div>
					<div class="sparkle-line"></div>
					<button class="tc-btn">T&C</button>
				</div>
			{/each}
		{/if}
	</div>
</section>

<style>
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
		background: transparent;
		color: var(--color-text-secondary);
		font-size: 0.8rem;
		padding: 4px 12px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: var(--radius-full);
		transition: all 0.2s;
	}

	.tc-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text-primary);
	}
</style>
