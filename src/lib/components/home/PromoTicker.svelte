<script lang="ts">
	import { appSettings } from '$lib/stores/appSettings';
	
	const isEnabled = $derived(($appSettings.promoTickerEnabled ?? true) && !!$appSettings.promoTickerText);
	const promoText = $derived($appSettings.promoTickerText || "✨ FESTIVE SPECIAL: Get 15% OFF on all Premium Beauty Packages this week! ✨");

	const scrollToOffers = (e: Event) => {
		e.preventDefault();
		const target = document.getElementById('special-offers');
		if (!target) return;
		
		const headerOffset = 60;
		// Some browsers use documentElement, some use body for scrollY
		const currentScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
		const targetPosition = target.getBoundingClientRect().top + currentScroll - headerOffset;
		const distance = targetPosition - currentScroll;
		const duration = 1200; // 1.2s slow premium feel
		let startTime: number | null = null;

		const ease = (t: number, b: number, c: number, d: number) => {
			t /= d / 2;
			if (t < 1) return (c / 2) * t * t * t * t + b;
			t -= 2;
			return (-c / 2) * (t * t * t * t - 2) + b;
		};

		const animation = (currentTime: number) => {
			if (startTime === null) startTime = currentTime;
			const timeElapsed = currentTime - startTime;
			const run = ease(timeElapsed, currentScroll, distance, duration);
			
			// Try all standard scroll containers
			window.scrollTo(0, run);
			document.documentElement.scrollTop = run;
			document.body.scrollTop = run;
			
			if (timeElapsed < duration) {
				requestAnimationFrame(animation);
			} else {
				window.scrollTo(0, targetPosition);
				document.documentElement.scrollTop = targetPosition;
				document.body.scrollTop = targetPosition;
			}
		};

		requestAnimationFrame(animation);
	};
</script>

{#if isEnabled}
	<a href="#special-offers" class="promo-ticker" onclick={scrollToOffers}>
		<div class="ticker-content">
			<span class="ticker-text">{promoText}</span>
			<span class="ticker-text">{promoText}</span>
			<span class="ticker-text">{promoText}</span>
		</div>
	</a>
{/if}

<style>
	.promo-ticker {
		display: flex;
		width: 100%;
		background: linear-gradient(135deg, #9333ea, #db2777, #f43f5e);
		color: #ffffff;
		overflow: hidden;
		position: absolute;
		top: 56px;
		left: 0;
		text-decoration: none;
		height: 30px;
		align-items: center;
		z-index: 500;
		box-shadow: 0 4px 15px rgba(219, 39, 119, 0.4);
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	}

	.ticker-content {
		display: flex;
		white-space: nowrap;
		animation: scroll 20s linear infinite;
	}

	.ticker-text {
		font-weight: 700;
		font-size: 0.85rem;
		letter-spacing: 0.05em;
		padding-right: 2rem;
		text-transform: uppercase;
	}

	@keyframes scroll {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-33.33%);
		}
	}
</style>
