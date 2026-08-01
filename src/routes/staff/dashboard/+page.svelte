<script lang="ts">
	import { staffUser } from '$lib/stores/staffAuth';
	import { upcomingBookings, todayBookings, staffBookings } from '$lib/stores/staffData';
	import { updateBookingStatus } from '$lib/stores/adminData';
	import { showToast } from '$lib/stores/toast';
	import {
		now,
		getElapsedSeconds,
		startServiceTimer,
		pauseTimer,
		resumeTimer,
		completeTimer
	} from '$lib/stores/serviceTimer';
	import BookingModal from '$lib/components/staff/BookingModal.svelte';
	import BookingCard from '$lib/components/staff/BookingCard.svelte';
	import CircularProgress from '$lib/components/staff/CircularProgress.svelte';
	import StatusBadge from '$lib/components/staff/StatusBadge.svelte';
	import EmptyState from '$lib/components/staff/EmptyState.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	// Mask phone: show first 3 and last 2 digits, stars in between
	function maskPhone(phone: string): string {
		if (!phone) return '';
		const digits = phone.replace(/\D/g, '');
		if (digits.length <= 5) return '*'.repeat(digits.length);
		return digits.slice(0, 3) + '*'.repeat(digits.length - 5) + digits.slice(-2);
	}
	import {
		requestNotificationPermission,
		notificationStatus,
		checkNotificationStatus,
		showListeningNotification
	} from '$lib/stores/staffNotifications';

	onMount(async () => {
		// Load push enabled state from Firestore for staff app
		if ($staffUser) {
			await checkNotificationStatus($staffUser.uid, 'staff');
		} else {
			checkNotificationStatus();
		}

		// Auto-prompt to enable push notifications if not decided yet
		setTimeout(() => {
			if ($notificationStatus === 'default' && $staffUser) {
				requestNotificationPermission($staffUser.uid, 'staff').then((success) => {
					if (success) {
						showToast('Push Notifications Enabled!', 'success');
					}
				});
			} else if ($notificationStatus === 'granted') {
				// Permission was already granted (e.g. returning user) — ensure
				// the persistent listening notification is visible.
				showListeningNotification();
			}
		}, 2000); // Wait 2s for dashboard to settle
	});

	// Data
	let nextAppointment = $derived($upcomingBookings[0]);
	let todayCount = $derived($todayBookings.length);
	let pendingCount = $derived($upcomingBookings.filter((b) => b.status === 'pending').length);
	let inProgressCount = $derived($todayBookings.filter((b) => b.status === 'in-progress').length);

	// Performance stats (calculated from real data)
	let completedToday = $derived($todayBookings.filter((b) => b.status === 'completed').length);
	let todayRevenue = $derived(
		$todayBookings
			.filter((b) => b.status === 'completed')
			.reduce((sum, b) => sum + (b.totalAmount || b.price || 0), 0)
	);

	// Modal state
	let isModalOpen = $state(false);
	let modalMode = $state('create');
	let selectedBooking = $state<any>(null);

	// Queue (walk-ins)
	let showWalkinForm = $state(false);
	let walkinName = $state('');
	let walkinService = $state('');

	// Revenue privacy toggle
	let showRevenue = $state(false);
	let revenueTimeout: ReturnType<typeof setTimeout> | null = null;

	function handleRevenueClick() {
		showRevenue = true;
		if (revenueTimeout) clearTimeout(revenueTimeout);
		revenueTimeout = setTimeout(() => {
			showRevenue = false;
		}, 3000);
	}

	function openBooking(booking: any) {
		selectedBooking = booking;
		modalMode = 'edit';
		isModalOpen = true;
	}

	async function handleStatusChange(id: string, newStatus: string, e?: Event) {
		e?.stopPropagation();
		if (newStatus === 'cancelled' || newStatus === 'completed') {
			if (!confirm(`Mark this booking as ${newStatus}?`)) return;
		}
		try {
			await updateBookingStatus(id, newStatus);
			showToast(`Booking marked as ${newStatus}`, 'success');
			if ('vibrate' in navigator) navigator.vibrate(15);
		} catch (error) {
			console.error(error);
			showToast('Failed to update status', 'error');
		}
	}

	function getFirstName(name: string | null) {
		return name?.split(' ')[0] || 'Member';
	}

	function getGreeting() {
		const h = new Date().getHours();
		if (h < 12) return 'Good Morning';
		if (h < 17) return 'Good Afternoon';
		return 'Good Evening';
	}

	function getTimeRemaining(dateStr: string, timeStr: string) {
		if (!dateStr || !timeStr) return '';
		const now = new Date();
		const bookingDateTime = new Date(dateStr);

		// Parse time (handle both "HH:MM" and "HH:MM AM/PM")
		const cleaned = timeStr.replace(/\s*(AM|PM)\s*/i, '').trim();
		const parts = cleaned.split(':');
		let hours = parseInt(parts[0], 10);
		const minutes = parseInt(parts[1] || '0', 10);
		if (isNaN(hours)) return '';

		// Handle AM/PM conversion
		if (/PM/i.test(timeStr) && hours !== 12) hours += 12;
		if (/AM/i.test(timeStr) && hours === 12) hours = 0;

		bookingDateTime.setHours(hours, minutes, 0, 0);
		const diffMs = bookingDateTime.getTime() - now.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		if (diffMins <= 0) return 'Now';
		if (diffMins < 60) return `${diffMins}m`;
		const diffHrs = Math.floor(diffMins / 60);
		const remMins = diffMins % 60;
		return remMins > 0 ? `${diffHrs}h ${remMins}m` : `${diffHrs}h`;
	}

	async function handleCompleteService(booking: any) {
		goto(`/staff/bookings/${booking.id}`);
	}

	function formatTime12h(time: string) {
		if (!time) return '';
		// Strip AM/PM if present and parse
		const cleaned = time.replace(/\s*(AM|PM)\s*/i, '').trim();
		const parts = cleaned.split(':');
		const h = parseInt(parts[0], 10);
		const m = parseInt(parts[1] || '0', 10);
		if (isNaN(h)) return time;
		const ampm = h >= 12 ? 'PM' : 'AM';
		const h12 = h % 12 || 12;
		return `${h12}:${(isNaN(m) ? 0 : m).toString().padStart(2, '0')} ${ampm}`;
	}

	function formatDuration(mins: number) {
		if (mins >= 60) {
			const h = Math.floor(mins / 60);
			const m = mins % 60;
			return m > 0 ? `${h}h ${m}m` : `${h}h`;
		}
		return `${mins}m`;
	}

	// Payment info helpers
	function getPaymentLabel(booking: any): string {
		const p = booking.payment;
		if (!p) return '';
		if (p.type === 'full') return 'Prepaid';
		if (p.type === 'token') return 'Token';
		if (p.type === 'free' || p.method === 'pay_at_salon') return 'Pay at Salon';
		return '';
	}

	function getPaymentMethodIcon(booking: any): string {
		const p = booking.payment;
		if (!p) return '';
		if (p.type === 'full') return '💳';
		if (p.type === 'token') return '🪙';
		return '🏪';
	}

	function getPaymentBadgeClass(booking: any): string {
		const p = booking.payment;
		if (!p) return '';
		if (p.type === 'full') return 'payment-prepaid';
		if (p.type === 'token') return 'payment-token';
		return 'payment-salon';
	}
</script>

<div class="dashboard s-stagger">
	<!-- ━━━ HERO WELCOME ━━━ -->
	<section class="hero-card">
		<div class="hero-gradient"></div>
		<div class="hero-content">
			<div class="hero-text">
				<p class="hero-greeting">{getGreeting()}</p>
				<h2 class="hero-name">{getFirstName($staffUser?.displayName)} ✨</h2>
				<p class="hero-date">
					{new Date().toLocaleDateString('en-US', {
						weekday: 'long',
						month: 'long',
						day: 'numeric'
					})}
				</p>
			</div>
			<div class="hero-avatar">
				{#if $staffUser?.photoURL}
					<img src={$staffUser.photoURL} alt="Profile" />
				{:else}
					<div class="avatar-placeholder">{getFirstName($staffUser?.displayName)?.[0] || 'S'}</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- ━━━ QUICK ACTIONS ━━━ -->
	<section class="quick-actions">
		<button
			class="qa-btn qa-booking"
			onclick={() => {
				modalMode = 'create';
				isModalOpen = true;
			}}
		>
			<span class="qa-icon">➕</span>
			<span class="qa-label">Booking</span>
		</button>
		<button class="qa-btn qa-schedule" onclick={() => goto('/staff/schedule')}>
			<span class="qa-icon">📅</span>
			<span class="qa-label">Schedule</span>
		</button>
		<button class="qa-btn qa-services" onclick={() => goto('/staff/custom-services')}>
			<span class="qa-icon">✨</span>
			<span class="qa-label">Services</span>
		</button>
		<button class="stat-card accent" onclick={handleRevenueClick}>
			<span class="stat-value" style="min-width: 60px; transition: all 0.3s ease;">
				{showRevenue ? `₹${todayRevenue.toLocaleString()}` : '••••'}
			</span>
			<span class="stat-label">Revenue</span>
			<span class="stat-icon">💰</span>
		</button>
	</section>

	<!-- ━━━ STATS ROW ━━━ -->
	<section class="stats-row">
		<button class="stat-card" onclick={() => goto('/staff/bookings?filter=upcoming')}>
			<span class="stat-value">{todayCount}</span>
			<span class="stat-label">Today</span>
			<span class="stat-icon">📅</span>
		</button>
		<button class="stat-card" onclick={() => goto('/staff/bookings?filter=pending')}>
			<span class="stat-value">{pendingCount}</span>
			<span class="stat-label">Pending</span>
			<span class="stat-icon">⏳</span>
		</button>
		<button class="stat-card highlight" onclick={() => goto('/staff/bookings?filter=completed')}>
			<span class="stat-value">{completedToday}</span>
			<span class="stat-label">Done</span>
			<span class="stat-icon">✅</span>
		</button>
		<button class="qa-btn qa-history" onclick={() => goto('/staff/bookings')}>
			<span class="qa-icon">📋</span>
			<span class="qa-label">All</span>
		</button>
	</section>

	<!-- ━━━ UP NEXT ━━━ -->
	{#if $upcomingBookings.length > 0}
		<section class="upnext-section">
			<div class="s-section-header">
				<div style="display: flex; align-items: center; gap: 8px;">
					<h3 class="s-section-title">Today's Queue</h3>
					{#if $upcomingBookings[0]}
						<span class="upnext-countdown">
							{getTimeRemaining($upcomingBookings[0].date, $upcomingBookings[0].time)}
						</span>
					{/if}
				</div>
				<button
					class="s-section-action"
					onclick={() => goto('/staff/schedule')}
					style="background: none; border: none; font-size: 0.85rem; color: var(--s-text-secondary); cursor: pointer; padding: 0;"
					>View All →</button
				>
			</div>

			<div class="upnext-list">
				{#each $upcomingBookings as booking}
					<BookingCard
						booking={booking}
						now={$now}
						onOpen={openBooking}
						onResume={(b) => resumeTimer(b)}
						onPause={(b) => pauseTimer(b)}
						onComplete={(b) => handleCompleteService(b)}
					/>
				{/each}
			</div>
		</section>
	{:else}
		<section class="upnext-section">
			<EmptyState
				icon="☕"
				title="All Caught Up!"
				description="No upcoming appointments. Time for a break?"
			/>
		</section>
	{/if}
</div>

<BookingModal
	bind:isOpen={isModalOpen}
	mode={modalMode}
	existingBooking={selectedBooking}
	onClose={() => (isModalOpen = false)}
/>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: var(--s-space-xl);
		position: relative;
		min-height: 100%;
		z-index: 1;
		padding: 0 0 100px 0;
		animation: s-fadeIn 0.3s ease;
	}

	/* ━━━ HERO ━━━ */
	.hero-card {
		position: relative;
		border-radius: 24px;
		padding: var(--s-space-xl) var(--s-space-xl);
		overflow: hidden;
		color: white;
		box-shadow:
			0 20px 40px -10px rgba(99, 102, 241, 0.4),
			inset 0 1px 1px rgba(255, 255, 255, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.15);
		transform-style: preserve-3d;
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
	}

	.hero-card:active {
		transform: scale(0.98);
	}

	.hero-card::before {
		content: '';
		position: absolute;
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.08);
		top: -20px;
		right: 30%;
		z-index: 0;
	}

	.hero-card::after {
		content: '';
		position: absolute;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.05);
		bottom: -10px;
		left: 20%;
		z-index: 0;
	}

	.hero-gradient {
		position: absolute;
		inset: 0;
		background: linear-gradient(-45deg, #1a0a2e, #3730a3, #7c3aed, #6366f1, #4f46e5);
		background-size: 300% 300%;
		animation: s-gradientShift 8s ease infinite;
		z-index: 0;
	}

	:global(.staff-app.dark) .hero-gradient {
		background: linear-gradient(-45deg, #0d0520, #1e1060, #3b0764, #312e81, #1e1b4b);
		background-size: 300% 300%;
		animation: s-gradientShift 8s ease infinite;
	}

	.hero-content {
		position: relative;
		z-index: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transform: translateZ(20px);
	}

	.hero-greeting {
		margin: 0;
		font-size: 0.75rem;
		opacity: 0.9;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.hero-name {
		margin: 4px 0 4px;
		font-family: var(--s-font-display);
		font-size: 1.7rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.hero-date {
		margin: 0;
		font-size: 0.85rem;
		opacity: 0.85;
		font-weight: 500;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.hero-avatar {
		position: relative;
		width: 64px;
		height: 64px;
		font-size: 1.8rem;
		border-radius: 50%;
		transition: all 0.4s var(--s-ease-spring);
	}

	.hero-avatar::before {
		content: '';
		position: absolute;
		inset: -5px;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(232, 167, 48, 0.6), rgba(255, 255, 255, 0.3));
		background-size: 200% 200%;
		animation: s-gradientShift 4s ease infinite;
		z-index: 0;
		box-shadow: 0 4px 20px rgba(232, 167, 48, 0.3);
		transition: all 0.4s var(--s-ease-spring);
	}

	.hero-avatar img {
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid transparent;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		background-clip: padding-box;
		transition: all 0.4s var(--s-ease-spring);
	}

	.hero-avatar .avatar-placeholder {
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(12px);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		font-size: inherit;
		border: 2px solid rgba(255, 255, 255, 0.4);
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3);
		transition: all 0.4s var(--s-ease-spring);
	}

	/* ━━━ QUICK ACTIONS ━━━ */
	.quick-actions {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--s-space-md);
	}

	.qa-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: var(--s-space-md) var(--s-space-sm);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.6);
		border-radius: 20px;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		box-shadow:
			0 10px 20px -5px rgba(0, 0, 0, 0.08),
			inset 0 2px 2px rgba(255, 255, 255, 1);
		position: relative;
		overflow: hidden;
	}

	:global(.staff-app.dark) .qa-btn {
		background: linear-gradient(180deg, rgba(40, 40, 50, 0.8) 0%, rgba(20, 20, 25, 0.4) 100%);
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow:
			0 10px 20px -5px rgba(0, 0, 0, 0.3),
			inset 0 1px 1px rgba(255, 255, 255, 0.05);
	}

	.qa-btn::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 3px;
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}

	.qa-services::after {
		background: var(--s-grad-violet);
	}
	.qa-booking::after {
		background: var(--s-grad-rose);
	}
	.qa-schedule::after {
		background: var(--s-grad-teal);
	}
	.qa-history::after {
		background: var(--s-grad-gold);
	}

	.qa-btn:hover::after {
		opacity: 1;
	}

	.qa-btn:hover {
		transform: translateY(-4px);
		box-shadow:
			0 15px 25px -5px rgba(0, 0, 0, 0.12),
			inset 0 2px 2px rgba(255, 255, 255, 1);
	}

	.qa-btn:active {
		transform: translateY(2px) scale(0.95);
		box-shadow:
			0 4px 10px -5px rgba(0, 0, 0, 0.1),
			inset 0 2px 2px rgba(255, 255, 255, 1);
	}

	.qa-icon {
		font-size: 1.6rem;
		filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
		transition: transform 0.3s ease;
	}

	.qa-btn:hover .qa-icon {
		transform: scale(1.1) rotate(5deg);
	}

	.qa-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--s-text-primary);
		letter-spacing: 0.02em;
	}

	/* ━━━ ACTIVE SERVICE TIMER ━━━ */
	.active-service-card {
		background: var(--s-surface);
		border: 2px solid var(--s-accent);
		border-radius: var(--s-radius-xl);
		padding: var(--s-space-xl);
		box-shadow: var(--s-shadow-glow);
		animation: s-scaleIn 0.4s var(--s-ease-spring);
	}

	.service-timer-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--s-space-md);
	}

	.timer-label {
		font-size: var(--s-text-xs);
		font-weight: 700;
		text-transform: uppercase;
		color: var(--s-accent);
		letter-spacing: 0.05em;
	}

	.timer-client {
		margin: 4px 0 2px;
		font-family: var(--s-font-display);
		font-size: var(--s-text-lg);
		font-weight: 700;
	}

	.timer-phone,
	.upnext-phone {
		margin: 2px 0 0;
		font-size: 0.75rem;
		color: var(--s-text-tertiary);
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.phone-icon {
		flex-shrink: 0;
		opacity: 0.6;
	}

	.no-phone {
		font-style: italic;
		opacity: 0.6;
	}

	.timer-service {
		margin: 0;
		font-size: var(--s-text-sm);
		color: var(--s-text-secondary);
	}

	.timer-value {
		font-family: var(--s-font-display);
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--s-accent);
	}

	.timer-value.overtime {
		color: var(--s-error);
	}

	.timer-remaining {
		text-align: center;
		margin-bottom: var(--s-space-md);
	}

	.remaining-text {
		font-size: var(--s-text-sm);
		color: var(--s-text-secondary);
		font-weight: 500;
	}

	.overtime-text {
		font-size: var(--s-text-sm);
		color: var(--s-error);
		font-weight: 600;
	}

	.timer-actions {
		display: flex;
		gap: var(--s-space-md);
		margin-top: var(--s-space-sm);
	}

	.timer-notes {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		margin-top: var(--s-space-sm);
		margin-bottom: var(--s-space-xs);
		padding: 10px 14px;
		background: #fef9c3;
		border-radius: var(--s-radius-md);
		border-left: 3px solid #eab308;
	}
	:global(.staff-app.dark) .timer-notes {
		background: rgba(234, 179, 8, 0.1);
		border-left-color: #facc15;
	}

	.timer-notes-icon {
		font-size: 0.9rem;
		flex-shrink: 0;
		margin-top: 1px;
	}

	.timer-notes-text {
		margin: 0;
		font-size: var(--s-text-sm);
		font-weight: 500;
		color: #92400e;
		line-height: 1.4;
		font-style: italic;
	}
	:global(.staff-app.dark) .timer-notes-text {
		color: #fde68a;
	}

	.timer-notes.notes-empty {
		background: var(--s-bg-tertiary);
		border-left-color: var(--s-border);
	}
	:global(.staff-app.dark) .timer-notes.notes-empty {
		background: rgba(255, 255, 255, 0.04);
		border-left-color: rgba(255, 255, 255, 0.1);
	}

	.notes-none {
		color: var(--s-text-tertiary);
		font-style: italic;
		font-weight: 400;
	}

	.timer-btn-outline {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 12px 18px;
		border-radius: var(--s-radius-lg);
		font-weight: 700;
		font-size: 0.9rem;
		background: transparent;
		color: var(--s-text-primary);
		border: 1.5px solid var(--s-border-strong);
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.timer-btn-outline:active {
		transform: scale(0.97);
	}
	:global(.staff-app.dark) .timer-btn-outline {
		border-color: rgba(255, 255, 255, 0.2);
	}

	.timer-btn-complete {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px 20px;
		border-radius: var(--s-radius-lg);
		font-weight: 700;
		font-size: 0.9rem;
		border: none;
		cursor: pointer;
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
		transition: all 0.3s ease;
	}
	@media (hover: hover) {
		.timer-btn-complete:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
		}
	}
	.timer-btn-complete:active {
		transform: translateY(0);
	}
	:global(.staff-app.dark) .timer-btn-complete {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}

	/* ━━━ STATS ROW ━━━ */
	.stats-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--s-space-md);
		margin-top: 8px;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: var(--s-space-md) var(--s-space-xs);
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6));
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.8);
		border-radius: 20px;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow:
			0 8px 16px -4px rgba(0, 0, 0, 0.06),
			inset 0 2px 2px rgba(255, 255, 255, 1);
		position: relative;
		overflow: hidden;
	}

	:global(.staff-app.dark) .stat-card {
		background: linear-gradient(135deg, rgba(40, 40, 50, 0.9), rgba(20, 20, 25, 0.6));
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow:
			0 8px 16px -4px rgba(0, 0, 0, 0.2),
			inset 0 1px 1px rgba(255, 255, 255, 0.05);
	}

	.stat-card::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 60%);
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}

	.stat-card:hover::before {
		opacity: 0.3;
	}

	.stat-card:active {
		transform: scale(0.95) translateY(2px);
	}

	.stat-card:nth-child(1) {
		border-top: 3px solid var(--s-accent-2, #7c3aed);
		background: linear-gradient(135deg, rgba(124, 58, 237, 0.06) 0%, rgba(255, 255, 255, 0.9) 100%);
	}
	.stat-card:nth-child(2) {
		border-top: 3px solid var(--s-accent-3, #f43f5e);
		background: linear-gradient(135deg, rgba(244, 63, 94, 0.06) 0%, rgba(255, 255, 255, 0.9) 100%);
	}
	.stat-card:nth-child(3) {
		border-top: 3px solid var(--s-success, #10b981);
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(255, 255, 255, 0.9) 100%);
	}

	:global(.staff-app.dark) .stat-card:nth-child(1) {
		background: linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(40, 40, 50, 0.9) 100%);
	}
	:global(.staff-app.dark) .stat-card:nth-child(2) {
		background: linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(40, 40, 50, 0.9) 100%);
	}
	:global(.staff-app.dark) .stat-card:nth-child(3) {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(40, 40, 50, 0.9) 100%);
	}

	.stat-card.accent {
		background: linear-gradient(135deg, #fef3c7 0%, #fefce8 100%);
		border: 1px solid #fde68a;
		border-top: 3px solid #d97706;
		box-shadow:
			0 8px 16px -4px rgba(217, 119, 6, 0.15),
			inset 0 2px 2px rgba(255, 255, 255, 1);
	}

	:global(.staff-app.dark) .stat-card.accent {
		background: linear-gradient(135deg, rgba(146, 64, 14, 0.4) 0%, rgba(120, 53, 15, 0.2) 100%);
		border-color: rgba(217, 119, 6, 0.3);
		border-top-color: #d97706;
	}

	.stat-icon {
		position: absolute;
		top: 8px;
		right: 8px;
		font-size: 0.8rem;
		opacity: 0.8;
		background: rgba(255, 255, 255, 0.5);
		width: 20px;
		height: 20px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.staff-app.dark) .stat-icon {
		background: rgba(0, 0, 0, 0.2);
	}

	.stat-value {
		font-family: var(--s-font-display);
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--s-text-primary);
		line-height: 1.2;
		margin-top: 6px;
		animation: s-countUp 0.5s var(--s-ease) backwards;
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
	}

	.stat-card.accent .stat-value {
		color: #d97706;
	}

	:global(.staff-app.dark) .stat-card.accent .stat-value {
		color: #fbbf24;
	}

	.stat-label {
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--s-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: 4px;
	}

	/* ━━━ UP NEXT ━━━ */

	.upnext-section :global(.s-section-title) {
		position: relative;
		padding-bottom: 6px;
	}
	.upnext-section :global(.s-section-title)::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 40px;
		height: 3px;
		border-radius: 2px;
		background: var(--s-grad-aurora);
	}

	.upnext-list {
		display: flex;
		flex-direction: column;
		gap: var(--s-space-md);
	}

	.upnext-list > .upnext-card {
		animation: s-fadeInUp 0.4s var(--s-ease-spring) backwards;
	}
	.upnext-list > .upnext-card:nth-child(1) { animation-delay: 0ms; }
	.upnext-list > .upnext-card:nth-child(2) { animation-delay: 80ms; }
	.upnext-list > .upnext-card:nth-child(3) { animation-delay: 160ms; }
	.upnext-list > .upnext-card:nth-child(4) { animation-delay: 240ms; }
	.upnext-list > .upnext-card:nth-child(5) { animation-delay: 320ms; }
	.upnext-list > .upnext-card:nth-child(6) { animation-delay: 400ms; }

	.upnext-countdown {
		font-size: var(--s-text-sm);
		font-weight: 700;
		color: var(--s-accent);
		background: var(--s-accent-bg);
		padding: 3px 10px 3px 20px;
		border-radius: var(--s-radius-full);
		position: relative;
	}

	.upnext-countdown::before {
		content: '';
		position: absolute;
		left: 8px;
		top: 50%;
		transform: translateY(-50%);
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--s-accent);
		animation: s-pulse 1.5s ease-in-out infinite;
	}

	/* ═══════════════════════════════════════════
	   UPNEXT CARD — Premium Elevated Design
	   ═══════════════════════════════════════════ */
	.upnext-card {
		padding: var(--s-space-lg);
		border-radius: var(--s-radius-xl);
		position: relative;
		overflow: hidden;
		background: var(--s-surface);
		border: 1px solid var(--s-border);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.04),
			0 6px 18px rgba(0, 0, 0, 0.06);
		transition:
			transform var(--s-duration-normal) var(--s-ease),
			box-shadow var(--s-duration-normal) var(--s-ease);
	}
	:global(.staff-app.dark) .upnext-card {
		background: var(--s-surface-raised);
		border-color: var(--s-border-strong);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.25),
			0 8px 24px rgba(0, 0, 0, 0.35);
	}
	@media (hover: hover) {
		.upnext-card:hover {
			transform: translateY(-3px);
			box-shadow:
				0 6px 12px rgba(0, 0, 0, 0.08),
				0 12px 36px rgba(0, 0, 0, 0.12);
		}
		:global(.staff-app.dark) .upnext-card:hover {
			box-shadow:
				0 8px 16px rgba(0, 0, 0, 0.35),
				0 16px 40px rgba(0, 0, 0, 0.45);
		}
	}
	.upnext-card:active {
		transform: scale(0.985);
	}

	/* ── Status Left Accent Bar ── */
	.card-pending,
	.card-confirmed,
	.card-completed,
	.card-cancelled {
		padding-left: calc(var(--s-space-lg) + 4px);
	}
	.card-pending::before,
	.card-confirmed::before,
	.card-completed::before,
	.card-cancelled::before {
		content: '';
		position: absolute;
		left: 0;
		top: 8px;
		bottom: 8px;
		width: 4.5px;
		border-radius: 0 var(--s-radius-sm) var(--s-radius-sm) 0;
	}

	/* ── Status-Specific Styles ── */
	.card-pending {
		background: var(--s-pending-bg);
		border-color: var(--s-border);
	}
	.card-pending::before {
		background: var(--s-pending);
	}

	.card-confirmed {
		background: var(--s-confirmed-bg);
		border-color: var(--s-border);
	}
	.card-confirmed::before {
		background: var(--s-confirmed);
	}

	.card-completed {
		background: var(--s-completed-bg);
		border-color: var(--s-border);
	}
	.card-completed::before {
		background: var(--s-completed);
	}

	.card-cancelled {
		background: var(--s-cancelled-bg);
		border-color: var(--s-border);
		opacity: 0.75;
	}
	.card-cancelled::before {
		background: var(--s-cancelled);
	}

	.upnext-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--s-space-md);
	}

	.upnext-client {
		display: flex;
		align-items: center;
		gap: var(--s-space-md);
	}

	.client-avatar-sm {
		width: 40px;
		height: 40px;
		border-radius: var(--s-radius-md);
		background: linear-gradient(135deg, var(--s-accent), var(--s-accent-dark, #b08d4f));
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1rem;
		flex-shrink: 0;
	}

	.upnext-details h4 {
		margin: 0;
		font-size: var(--s-text-md);
		font-weight: 700;
	}

	.upnext-service {
		margin: 4px 0 0;
		font-size: var(--s-text-sm);
		color: var(--s-text-secondary);
		padding: 3px 0;
		line-height: 1.6;
	}

	.upnext-meta {
		display: flex;
		gap: var(--s-space-lg);
		padding: var(--s-space-md) 0;
		border-top: 1px solid var(--s-border);
		border-bottom: 1px solid var(--s-border);
		margin-bottom: var(--s-space-md);
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: var(--s-text-sm);
		font-weight: 600;
		color: var(--s-text-secondary);
	}

	.meta-icon {
		font-size: 0.85rem;
	}

	.upnext-actions {
		display: flex;
		gap: var(--s-space-md);
		margin-top: var(--s-space-sm);
	}

	.action-btn-soft {
		flex: 1;
		padding: 10px 16px;
		border-radius: var(--s-radius-lg);
		font-weight: 700;
		font-size: 0.85rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}

	.action-btn-soft.confirm {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
	}
	@media (hover: hover) {
		.action-btn-soft.confirm:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
		}
	}
	:global(.staff-app.dark) .action-btn-soft.confirm {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.action-btn-soft.decline {
		flex: 0.5;
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
	}
	@media (hover: hover) {
		.action-btn-soft.decline:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
		}
	}
	:global(.staff-app.dark) .action-btn-soft.decline {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.action-btn-premium {
		flex: 1;
		padding: 10px 18px;
		border-radius: var(--s-radius-lg);
		font-weight: 700;
		font-size: 0.85rem;
		border: none;
		cursor: pointer;
		background: linear-gradient(135deg, var(--s-accent) 0%, var(--s-accent-dark, #b08d4f) 100%);
		color: white;
		box-shadow: 0 4px 14px rgba(232, 167, 48, 0.35);
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		letter-spacing: 0.02em;
		position: relative;
		overflow: hidden;
	}

	.action-btn-premium::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		animation: s-shimmer 2.5s ease-in-out infinite;
	}

	@media (hover: hover) {
		.action-btn-premium:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(201, 169, 110, 0.3);
		}
	}
	.action-btn-premium:active {
		transform: translateY(0);
	}
	:global(.staff-app.dark) .action-btn-premium {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}

	/* Active Service Mode Modifier */
	.upnext-card.active-service-mode {
		background: var(--s-surface);
		border: 2px solid var(--s-accent);
		box-shadow: var(--s-shadow-glow);
		animation: s-scaleIn 0.4s var(--s-ease-spring);
	}

	/* ── Payment Info ── */
	.db-payment {
		display: flex;
		align-items: center;
		gap: var(--s-space-sm);
		margin-top: var(--s-space-sm);
		flex-wrap: wrap;
	}

	.db-payment.timer-payment {
		justify-content: center;
		margin-bottom: var(--s-space-sm);
		padding-top: var(--s-space-sm);
		border-top: 1px solid var(--s-border);
	}

	.payment-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 3px 10px;
		border-radius: var(--s-radius-full);
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.payment-prepaid {
		background: rgba(16, 185, 129, 0.12);
		color: #059669;
	}
	:global(.staff-app.dark) .payment-prepaid {
		background: rgba(16, 185, 129, 0.15);
		color: #34d399;
	}

	.payment-token {
		background: rgba(217, 164, 6, 0.12);
		color: #b45309;
	}
	:global(.staff-app.dark) .payment-token {
		background: rgba(217, 164, 6, 0.15);
		color: #fbbf24;
	}

	.payment-salon {
		background: rgba(59, 130, 246, 0.1);
		color: #2563eb;
	}
	:global(.staff-app.dark) .payment-salon {
		background: rgba(59, 130, 246, 0.15);
		color: #60a5fa;
	}

	.payment-details {
		display: flex;
		align-items: center;
		gap: var(--s-space-sm);
	}

	.payment-paid {
		font-size: var(--s-text-xs);
		font-weight: 600;
		color: #059669;
	}
	:global(.staff-app.dark) .payment-paid {
		color: #34d399;
	}

	.payment-due {
		font-size: var(--s-text-xs);
		font-weight: 600;
		color: var(--s-error, #ef4444);
	}

	/* ━━━ SCHEDULE PREVIEW ━━━ */
	.schedule-list {
		display: flex;
		flex-direction: column;
	}

	.schedule-item {
		display: flex;
		gap: var(--s-space-md);
		padding: var(--s-space-md) 0;
	}

	.si-time {
		width: 60px;
		flex-shrink: 0;
		padding-top: 2px;
	}

	.si-time-text {
		font-size: var(--s-text-sm);
		font-weight: 600;
		color: var(--s-text-secondary);
	}

	.si-connector {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 16px;
		flex-shrink: 0;
	}

	.si-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--s-border-strong);
		flex-shrink: 0;
		margin-top: 5px;
	}

	.si-dot.pending {
		background: var(--s-pending);
	}
	.si-dot.confirmed {
		background: var(--s-confirmed);
	}
	.si-dot.in-progress {
		background: var(--s-in-progress);
	}
	.si-dot.completed {
		background: var(--s-completed);
	}

	.si-line {
		flex: 1;
		width: 1.5px;
		background: var(--s-border);
		margin: 4px 0;
	}

	.si-content {
		flex: 1;
		min-width: 0;
		padding-bottom: var(--s-space-md);
		border-bottom: 1px solid var(--s-border);
	}

	.schedule-item:last-child .si-content {
		border-bottom: none;
	}

	.si-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.si-name {
		margin: 0;
		font-size: var(--s-text-base);
		font-weight: 600;
	}

	.si-service {
		margin: 2px 0 0;
		font-size: var(--s-text-sm);
		color: var(--s-text-secondary);
	}

	.si-more {
		background: var(--s-bg-tertiary);
		padding: 1px 6px;
		border-radius: var(--s-radius-sm);
		font-size: var(--s-text-xs);
		color: var(--s-text-secondary);
		margin-left: 4px;
	}

	.si-meta {
		display: flex;
		gap: var(--s-space-md);
		margin-top: 4px;
		font-size: var(--s-text-xs);
		color: var(--s-text-tertiary);
		font-weight: 600;
	}

	/* ── Staff Assignment ── */
	.upnext-staff-row {
		margin-top: var(--s-space-sm);
		display: flex;
		align-items: center;
	}

	.staff-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px;
		border-radius: var(--s-radius-full);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.01em;
	}

	.staff-badge.assigned {
		background: rgba(59, 130, 246, 0.08);
		color: #2563eb;
		border: 1px solid rgba(59, 130, 246, 0.18);
	}
	:global(.staff-app.dark) .staff-badge.assigned {
		background: rgba(96, 165, 250, 0.12);
		color: #93bbfd;
		border-color: rgba(96, 165, 250, 0.2);
	}

	.staff-badge.unassigned {
		background: rgba(245, 158, 11, 0.1);
		color: #b45309;
		border: 1px dashed rgba(245, 158, 11, 0.4);
		animation: unassigned-pulse 2.5s ease-in-out infinite;
	}
	:global(.staff-app.dark) .staff-badge.unassigned {
		background: rgba(251, 191, 36, 0.1);
		color: #fbbf24;
		border-color: rgba(251, 191, 36, 0.35);
	}

	@keyframes unassigned-pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.action-btn-claim {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
		box-shadow: 0 2px 10px rgba(245, 158, 11, 0.3) !important;
	}
</style>
