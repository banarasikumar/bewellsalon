<script lang="ts">
	import { fade, slide, fly } from 'svelte/transition';
	import { 
		Sparkles, Users, Zap, Smartphone, CalendarCheck, Activity, Scissors, 
		Gift, Settings, Video, Star, UserPlus, ShieldCheck, Crown, Rocket, RefreshCw
	} from 'lucide-svelte';
	
	const updateCategories = [
		{
			category: "Staff & Team Management",
			icon: Users,
			color: "#30D158", // Green
			items: [
				{ title: 'Multi-Staff Management System', desc: 'Implemented capacity-based booking restrictions and better staff role management.', icon: ShieldCheck },
				{ title: 'Auto-Assignment & Staff Claim', desc: 'Staff can now click "Claim & Start" on an unassigned booking to auto-assign it to themselves instantly.', icon: Zap },
				{ title: 'Staff Booking UI (Dashboard)', desc: 'Added color-coded assignment badges (blue for assigned, amber pulsing for unassigned) and full dark mode support.', icon: Smartphone },
				{ title: 'Staff Booking UI (Bookings Tab)', desc: 'Organized all bookings (today\'s, past unfinished, future upcoming, and unassigned) perfectly on one synced screen.', icon: CalendarCheck },
			]
		},
		{
			category: "Admin Experience & Smart Logic",
			icon: Crown,
			color: "#BF5AF2", // Purple
			items: [
				{ title: 'Stats & Performance Dashboard', desc: 'Built a dynamic Salon-wide Overview with time filters (Today, Week, Month) and a Staff Leaderboard Grid.', icon: Activity },
				{ title: 'Admin Bookings Page Update', desc: 'Added an \'Unassigned\' filter chip and embedded staff assignment badges directly into the admin booking cards.', icon: Settings },
				{ title: 'Admin Booking UI Redesign', desc: 'A sleek, full-page booking details screen. Pending bookings auto-cancel after 24h past appt time, and delayed bookings pulse with an OVERDUE badge.', icon: CalendarCheck },
			]
		},
		{
			category: "Customer Experience & Growth",
			icon: Sparkles,
			color: "#FF9F0A", // Orange
			items: [
				{ title: 'Customer Booking Page', desc: 'Customers now see a beautiful staff selection grid with circular profile avatars when booking online.', icon: Scissors },
				{ title: 'Dynamic Offers & Promotions', desc: 'Added a premium scrolling promo ticker and special offer cards, easily controlled from the Admin app.', icon: Gift },
				{ title: 'Video Ads & Promo Support', desc: 'Eye-catching video ads that intelligently auto-play when customers scroll them into view to grab attention.', icon: Video },
				{ title: 'One-Click Google Map Review', desc: 'Customers are now automatically prompted to leave a 5-star Google review via WhatsApp after completing a service! ⭐', icon: Star },
				{ title: 'Refer & Earn System', desc: 'Fully automated referral system is LIVE! Get ₹150 for signing up, the referrer gets ₹100, and an extra ₹200 when the new user completes their first booking! 💰', icon: UserPlus },
			]
		},
		{
			category: "Performance & Stability",
			icon: Rocket,
			color: "#0A84FF", // Blue
			items: [
				{ title: 'Syntax & Runtime Error Fixes', desc: 'Fixed crashes, import errors, and filtered booking logic so the app runs buttery smooth.', icon: Activity },
			]
		}
	];
</script>

<div class="whatsnew-container" in:fade={{duration: 400}}>
	<!-- Header -->
	<header class="header">
		<div class="hero-badge" in:fly={{y: -10, delay: 100, duration: 600}}>
			<Rocket size={14} strokeWidth={2.5} /> COMPLETE UPDATE LIVE
		</div>
		<h1 in:fly={{y: 10, delay: 200, duration: 600}}>SALON SYSTEM V2</h1>
		<p class="subtitle" in:fade={{delay: 400, duration: 600}}>
			I’ve just rolled out a massive update!<br/>Here is the complete list of everything implemented and improved.
		</p>
	</header>

	<!-- Content -->
	<div class="updates-list">
		{#each updateCategories as category, cIdx}
			<div class="category-section" in:slide={{delay: cIdx * 150 + 500, duration: 500}}>
				<h2 class="category-title">
					<div class="cat-icon" style="background: {category.color}22; color: {category.color}; border: 1px solid {category.color}44;">
						<svelte:component this={category.icon} size={20} strokeWidth={2.5} />
					</div>
					{category.category}
				</h2>
				<div class="category-items">
					{#each category.items as item}
						<div class="update-card">
							<div class="icon-wrapper">
								<svelte:component this={item.icon} size={18} strokeWidth={2} />
							</div>
							<div class="content">
								<h3>{item.title}</h3>
								<p>{item.desc}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Footer -->
	<div class="footer" in:fade={{delay: 1200, duration: 800}}>
		<div class="footer-icon-wrapper">
			<RefreshCw size={32} class="footer-icon" strokeWidth={2} />
		</div>
		<h3>And a lot of features & changes under the hood.</h3>
		<p>Please refresh your browser or reload the app to see all the new features! 🎉</p>
	</div>
</div>

<style>
	.whatsnew-container {
		min-height: 100vh;
		background: #000;
		color: #fff;
		padding: 40px 20px 100px;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
		max-width: 640px;
		margin: 0 auto;
	}

	.header {
		text-align: center;
		margin-bottom: 48px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: rgba(212, 175, 55, 0.15);
		border: 1px solid rgba(212, 175, 55, 0.3);
		color: #d4af37;
		padding: 6px 12px;
		border-radius: 100px;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		margin-bottom: 16px;
	}

	h1 {
		font-family: 'Cinzel', serif;
		font-size: 2.8rem;
		font-weight: 800;
		margin: 0 0 16px 0;
		background: linear-gradient(135deg, #d4af37 0%, #f7e7ce 50%, #d4af37 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		line-height: 1.1;
	}

	.subtitle {
		color: #999;
		font-size: 1.05rem;
		line-height: 1.5;
		margin: 0;
		max-width: 90%;
	}

	.category-section {
		margin-bottom: 40px;
	}

	.category-title {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 1.3rem;
		font-weight: 700;
		margin: 0 0 20px 0;
		color: #fff;
		letter-spacing: -0.02em;
	}

	.cat-icon {
		width: 38px;
		height: 38px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.category-items {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.update-card {
		display: flex;
		gap: 16px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 16px;
		padding: 20px;
		transition: transform 0.2s ease, background 0.2s ease;
	}

	.update-card:active {
		transform: scale(0.98);
		background: rgba(255, 255, 255, 0.06);
	}

	.icon-wrapper {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #ccc;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.content h3 {
		margin: 0 0 6px 0;
		font-size: 1.05rem;
		font-weight: 600;
		color: #fff;
		line-height: 1.3;
	}

	.content p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
		color: #aaa;
	}

	.footer {
		margin-top: 64px;
		text-align: center;
		padding: 40px 20px;
		background: linear-gradient(180deg, rgba(212, 175, 55, 0.05) 0%, rgba(212, 175, 55, 0.01) 100%);
		border-radius: 24px;
		border: 1px dashed rgba(212, 175, 55, 0.2);
	}

	.footer-icon-wrapper {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: rgba(212, 175, 55, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 20px;
		color: #d4af37;
	}

	.footer h3 {
		font-size: 1.2rem;
		color: #fff;
		margin: 0 0 8px 0;
	}

	.footer p {
		color: #aaa;
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.5;
	}
</style>
