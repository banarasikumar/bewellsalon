<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { 
		Sparkles, Users, Zap, Smartphone, CalendarCheck, Activity, Scissors, 
		Gift, Settings, Video, Star, UserPlus, CheckCircle2 
	} from 'lucide-svelte';
	
	const updates = [
		{ title: 'Multi-Staff Management', desc: 'Capacity-based booking restrictions and better staff role management.', icon: Users },
		{ title: 'Auto-Assignment & Claims', desc: 'Staff can now click "Claim & Start" on an unassigned booking to auto-assign it instantly.', icon: Zap },
		{ title: 'Staff Booking Dashboard', desc: 'Added color-coded assignment badges (blue for assigned, amber for unassigned) and dark mode support.', icon: Smartphone },
		{ title: 'Organized Bookings Tab', desc: 'All bookings (today, past unfinished, future upcoming, and unassigned) organized perfectly on one synced screen.', icon: CalendarCheck },
		{ title: 'Error Fixes & Stability', desc: 'Fixed crashes and import errors so the app runs buttery smooth.', icon: Activity },
		{ title: 'Beautiful Staff Selection', desc: 'Customers now see a beautiful staff selection grid with circular profile avatars when booking online.', icon: Scissors },
		{ title: 'Admin Performance Dashboard', desc: 'Built a dynamic Salon-wide Overview with time filters and a Staff Leaderboard Grid.', icon: Activity },
		{ title: 'Dynamic Offers & Promos', desc: 'Added a premium scrolling promo ticker and special offer cards, easily controlled from Admin.', icon: Gift },
		{ title: 'Admin Bookings Upgrade', desc: 'Added an "Unassigned" filter chip and embedded staff assignment badges directly into admin booking cards.', icon: Settings },
		{ title: 'Video Ads Support', desc: 'Eye-catching video ads that intelligently auto-play when customers scroll them into view.', icon: Video },
		{ title: 'One-Click Google Reviews', desc: 'Customers are automatically prompted to leave a 5-star Google review via WhatsApp after a service!', icon: Star },
		{ title: 'Smart Booking Logic', desc: 'A sleek booking details screen. Pending bookings auto-cancel after 24h, and delayed bookings pulse OVERDUE.', icon: CalendarCheck },
		{ title: 'Refer & Earn System', desc: 'Fully automated referral system! Get ₹150 for signing up, referrer gets ₹100, and an extra ₹200 on first booking.', icon: UserPlus }
	];
</script>

<div class="whatsnew-container" in:fade={{duration: 300}}>
	<!-- Header -->
	<header class="header">
		<div class="title-wrapper">
			<Sparkles class="icon-sparkle" size={28} strokeWidth={2.5} />
			<h1>What's New</h1>
		</div>
		<p class="subtitle">Discover the latest features and improvements</p>
	</header>

	<!-- Content -->
	<div class="updates-list">
		{#each updates as update, i}
			<div 
				class="update-card" 
				in:slide={{delay: i * 50 + 100, duration: 400}}
			>
				<div class="icon-wrapper">
					<svelte:component this={update.icon} size={22} strokeWidth={2} />
				</div>
				<div class="content">
					<h3>{i + 1}. {update.title}</h3>
					<p>{update.desc}</p>
				</div>
			</div>
		{/each}
	</div>

	<!-- Footer -->
	<div class="footer">
		<CheckCircle2 size={32} class="footer-icon" strokeWidth={2} />
		<p>You're all caught up!</p>
	</div>
</div>

<style>
	.whatsnew-container {
		min-height: 100vh;
		background: var(--color-bg-primary, #000);
		color: var(--color-text-primary, #fff);
		padding: 32px 16px 100px;
		font-family: var(--font-body, 'Inter', sans-serif);
		max-width: 600px;
		margin: 0 auto;
	}

	.header {
		text-align: center;
		margin-bottom: 32px;
		padding-top: 20px;
	}

	.title-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-bottom: 8px;
	}

	.icon-sparkle {
		color: var(--color-accent-gold, #d4af37);
		animation: pulse 2s infinite;
	}

	h1 {
		font-family: var(--font-heading, 'Cinzel', serif);
		font-size: 2.2rem;
		font-weight: 700;
		margin: 0;
		background: var(--gradient-gold, linear-gradient(135deg, #d4af37 0%, #f7e7ce 50%, #d4af37 100%));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.subtitle {
		color: var(--color-text-muted, #888);
		font-size: 0.95rem;
		margin: 0;
	}

	.updates-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.update-card {
		display: flex;
		gap: 16px;
		background: var(--gradient-card, linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(20,20,20,0.4) 100%));
		border: 1px solid var(--color-border, rgba(255,255,255,0.12));
		border-radius: var(--radius-md, 16px);
		padding: 20px;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow: var(--shadow-card, 0 20px 40px -10px rgba(0,0,0,0.6));
		transition: var(--transition-smooth, 0.4s ease);
	}

	.update-card:active {
		transform: scale(0.98);
		background: var(--color-surface-active, rgba(255,255,255,0.12));
	}

	.icon-wrapper {
		flex-shrink: 0;
		width: 44px;
		height: 44px;
		border-radius: var(--radius-sm, 8px);
		background: var(--color-btn-bg, rgba(212,175,55,0.12));
		border: 1px solid var(--color-btn-border, rgba(212,175,55,0.3));
		color: var(--color-btn-text, #d4af37);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.content h3 {
		margin: 0 0 6px 0;
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--color-text-primary, #fff);
	}

	.content p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--color-text-secondary, #ccc);
	}

	.footer {
		margin-top: 48px;
		text-align: center;
		color: var(--color-text-muted, #888);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.footer-icon {
		color: var(--color-available-text, #4caf50);
	}

	@keyframes pulse {
		0% { transform: scale(1); opacity: 1; }
		50% { transform: scale(1.1); opacity: 0.7; }
		100% { transform: scale(1); opacity: 1; }
	}
</style>
