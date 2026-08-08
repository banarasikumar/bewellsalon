<script lang="ts">
	import { staffBookings, upcomingBookings } from '$lib/stores/staffData';
	import { updateBookingStatus, updateBookingDetails, type Booking } from '$lib/stores/adminData';
	import { staffUser } from '$lib/stores/staffAuth';
	import { showToast } from '$lib/stores/toast';
	import { Calendar, Clock, Timer } from 'lucide-svelte';
	import {
		now,
		getElapsedSeconds,
		startServiceTimer,
		pauseTimer,
		resumeTimer
	} from '$lib/stores/serviceTimer';
	import BookingModal from '$lib/components/staff/BookingModal.svelte';
	import BookingCard from '$lib/components/staff/BookingCard.svelte';
	import CircularProgress from '$lib/components/staff/CircularProgress.svelte';
	import ClientDrawer from '$lib/components/staff/ClientDrawer.svelte';

	// Mask phone: show first 3 and last 2 digits, stars in between
	function maskPhone(phone: string): string {
		if (!phone) return '';
		const digits = phone.replace(/\D/g, '');
		if (digits.length <= 5) return '*'.repeat(digits.length);
		return digits.slice(0, 3) + '*'.repeat(digits.length - 5) + digits.slice(-2);
	}
	import StatusBadge from '$lib/components/staff/StatusBadge.svelte';
	import EmptyState from '$lib/components/staff/EmptyState.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// Filter from URL
	let urlFilter = $derived(page.url.searchParams.get('filter') || 'upcoming');

	let activeFilter = $state('upcoming');
	let searchQuery = $state('');

	// Sync filter from URL param on mount
	$effect(() => {
		if (urlFilter) activeFilter = urlFilter;
	});

	const filters = [
		{ key: 'upcoming', label: '📅 Upcoming', emoji: '📅' },
		{ key: 'pending', label: '⏳ Pending', emoji: '⏳' },
		{ key: 'completed', label: '✅ Done', emoji: '✅' },
		{ key: 'all', label: '📋 All', emoji: '📋' },
		{ key: 'cancelled', label: '❌ Cancelled', emoji: '❌' }
	];

	let filteredBookings = $derived(() => {
		let bookings = [...$staffBookings];

		switch (activeFilter) {
			case 'upcoming':
				// $upcomingBookings already contains today's active bookings, future active bookings, and past unfinished bookings
				bookings = [...$upcomingBookings];
				break;
			case 'pending':
				bookings = bookings.filter((b) => b.status === 'pending');
				break;
			case 'completed':
				bookings = bookings.filter((b) => b.status === 'completed');
				break;
			case 'cancelled':
				bookings = bookings.filter((b) => b.status === 'cancelled');
				break;
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			bookings = bookings.filter(
				(b) =>
					b.userName?.toLowerCase().includes(q) ||
					b.serviceName?.toLowerCase().includes(q) ||
					b.servicesList?.some((s) => s.name.toLowerCase().includes(q))
			);
		}

		// Always sort newest-first
		return bookings.sort((a, b) => {
			const dateCmp = (b.date || '').localeCompare(a.date || '');
			if (dateCmp !== 0) return dateCmp;
			return (b.time || '').localeCompare(a.time || '');
		});
	});

	// Modal
	let isModalOpen = $state(false);
	let modalMode = $state('create');
	let selectedBooking = $state<any>(null);

	// Auto-open booking from URL query param
	let urlBookingId = $derived(page.url.searchParams.get('bookingId'));

	$effect(() => {
		if (urlBookingId && $staffBookings.length > 0) {
			const booking = $staffBookings.find((b) => b.id === urlBookingId);
			if (booking) {
				selectedBooking = booking;
				modalMode = 'edit';
				isModalOpen = true;
				// Clean up URL after opening
				const url = new URL(page.url);
				url.searchParams.delete('bookingId');
				goto(url, { replaceState: true, keepFocus: true });
			}
		}
	});

	// Client drawer
	let isDrawerOpen = $state(false);
	let drawerUserId = $state('');
	let drawerUserName = $state('');
	let drawerUserPhone = $state('');
	let drawerUserEmail = $state('');

	function openBooking(booking: any) {
		selectedBooking = booking;
		modalMode = 'edit';
		isModalOpen = true;
	}

	function openClient(booking: any) {
		drawerUserId = booking.userId || booking.userEmail || '';
		drawerUserName = booking.userName || 'Guest';
		drawerUserPhone = booking.userPhone || '';
		drawerUserEmail = booking.userEmail || '';
		isDrawerOpen = true;
	}

	async function quickAction(id: string, status: string, e?: Event) {
		e?.stopPropagation();
		if (status === 'cancelled' && !confirm('Cancel this booking?')) return;
		try {
			await updateBookingStatus(id, status);
			showToast(`Updated to ${status}`, 'success');
			if ('vibrate' in navigator) navigator.vibrate(10);
		} catch {
			showToast('Failed to update', 'error');
		}
	}

	function formatTime12h(time: string) {
		if (!time) return '';
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

	function formatDate(dateStr: string) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		const today = new Date();
		const todayStr = today.toISOString().split('T')[0];
		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);

		if (dateStr === todayStr) return 'Today';
		if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
		if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

	// Group bookings by date — for upcoming, split active vs done today
	let activeBookings = $derived(() => {
		const today = new Date().toISOString().split('T')[0];
		if (activeFilter === 'upcoming') {
			// Active = not completed/cancelled
			return filteredBookings().filter((b) => b.status !== 'completed' && b.status !== 'cancelled');
		}
		return filteredBookings();
	});

	let todayDoneBookings = $derived(() => {
		const today = new Date().toISOString().split('T')[0];
		if (activeFilter === 'upcoming') {
			return $staffBookings.filter(
				(b) => b.date === today && (b.status === 'completed' || b.status === 'cancelled')
			);
		}
		return [];
	});

	let groupedBookings = $derived(() => {
		const groups: Record<string, any[]> = {};
		activeBookings().forEach((b) => {
			const key = b.date || 'unknown';
			if (!groups[key]) groups[key] = [];
			groups[key].push(b);
		});
		if (activeFilter === 'upcoming') {
			return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0])); // chronological for upcoming
		}
		return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])); // newest-first for all other filters
	});

	let filterCounts = $derived(() => {
		const today = new Date().toISOString().split('T')[0];
		const counts: Record<string, number> = {
			upcoming: 0,
			pending: 0,
			completed: 0,
			cancelled: 0,
			all: $staffBookings.length
		};

		for (const b of $staffBookings) {
			if (b.status === 'pending') counts.pending++;
			if (b.status === 'completed') counts.completed++;
			if (b.status === 'cancelled') counts.cancelled++;

			if (b.date === today) {
				counts.upcoming++;
			} else if (b.date > today && b.status !== 'completed' && b.status !== 'cancelled') {
				counts.upcoming++;
			}
		}
		return counts;
	});
</script>

<div class="bookings-page">
	<!-- Search Bar -->
	<div class="search-section">
		<div class="search-wrap">
			<svg
				class="search-icon"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			>
				<circle cx="11" cy="11" r="8"></circle>
				<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
			</svg>
			<input
				type="text"
				class="search-input"
				placeholder="Search clients or services..."
				bind:value={searchQuery}
			/>
			{#if searchQuery}
				<button class="search-clear" onclick={() => (searchQuery = '')}>✕</button>
			{/if}
		</div>
	</div>

	<!-- Filter Pills -->
	<div class="filter-pills s-scrollbar-hide">
		{#each filters as filter}
			<button
				class="filter-pill"
				class:active={activeFilter === filter.key}
				onclick={() => {
					activeFilter = filter.key;
					goto(`/staff/bookings?filter=${filter.key}`, { replaceState: true });
				}}
			>
				{filter.label}
				{#if filterCounts()[filter.key] > 0}
					<span class="pill-badge">{filterCounts()[filter.key]}</span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Results Count -->
	<div class="results-bar">
		<span class="results-count">{filteredBookings().length} bookings</span>
	</div>

	<!-- Grouped Bookings -->
	{#if filteredBookings().length === 0}
		{#if activeFilter === 'upcoming'}
			<EmptyState
				icon="📅"
				title="No bookings for today"
				description={searchQuery ? 'Try a different search' : 'No upcoming bookings'}
				actionLabel={searchQuery ? 'Clear Filters' : ''}
				onAction={() => {
					searchQuery = '';
				}}
			/>
		{:else}
			<EmptyState
				icon="🔍"
				title="No bookings found"
				description={searchQuery ? 'Try a different search' : 'No bookings match this filter'}
				actionLabel="Clear Filters"
				onAction={() => {
					searchQuery = '';
					activeFilter = 'all';
				}}
			/>
		{/if}
	{:else}
		<div class="bookings-list s-stagger">
			{#if activeFilter === 'upcoming'}
				<div class="date-divider">
					<span class="dd-label">📅 Upcoming</span>
					<span class="dd-count">{activeBookings().length}</span>
				</div>
				{#if activeBookings().length === 0}
					<EmptyState
						icon="☕"
						title="All Caught Up!"
						description="No upcoming appointments. Time for a break?"
					/>
				{/if}
			{/if}
			{#each groupedBookings() as [dateKey, bookings]}
				<div class="date-group">
					<div class="date-divider">
						<span class="dd-label">{formatDate(dateKey)}</span>
						<span class="dd-count">{bookings.length}</span>
					</div>

					{#each bookings as booking}
						<BookingCard
								booking={booking}
								now={$now}
								onOpen={openBooking}
								onResume={(b) => resumeTimer(b)}
								onPause={(b) => pauseTimer(b)}
								onComplete={(b) => quickAction(b.id, 'completed')}
								onClientClick={openClient}
							/>
						{/each}
				</div>
			{/each}
		</div>

		{#if todayDoneBookings().length > 0}
			<div class="done-today-section">
				<div class="date-divider done-divider">
					<span class="dd-label">✅ Completed / Cancelled Today</span>
					<span class="dd-count">{todayDoneBookings().length}</span>
				</div>
				{#each todayDoneBookings() as booking}
					<div
						class="booking-card s-card s-card-interactive card-{booking.status}"
						onclick={() => openBooking(booking)}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && openBooking(booking)}
					>
						<div class="bc-body">
							<div class="bc-top">
								<button
									class="bc-avatar"
									onclick={(e) => {
										e.stopPropagation();
										openClient(booking);
									}}
								>
									{booking.userName?.[0]?.toUpperCase() || 'G'}
								</button>
								<div class="bc-info">
									<h4 class="bc-name">{booking.userName || 'Guest'}</h4>
									<p class="bc-phone">
										{#if booking.userPhone}
											<svg
												class="phone-icon"
												width="12"
												height="12"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><path
													d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
												/></svg
											>
											{maskPhone(booking.userPhone)}
										{:else}
											<span class="no-phone">No phone number</span>
										{/if}
									</p>
									<p class="bc-services">
										{#if booking.servicesList?.length}
											{booking.servicesList.map((s: any) => s.name).join(', ')}
										{:else}
											{booking.serviceName || 'Service'}
										{/if}
									</p>
								</div>
								<div class="bc-badges">
									<StatusBadge status={booking.status} size="sm" />
									{#if booking.status === 'completed'}
										{#if booking.payment?.status === 'paid'}
											<span class="pay-tag paid">✓ Paid</span>
										{:else}
											<span class="pay-tag unpaid">Unpaid</span>
										{/if}
									{/if}
								</div>
							</div>

							<!-- Staff Assignment (done-today) -->
							<div class="bc-staff-row">
								{#if booking.staffName && booking.staffId && booking.staffId !== 'unassigned'}
									<span class="staff-badge assigned">
										<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
										{booking.staffName}
									</span>
								{:else}
									<span class="staff-badge unassigned">
										<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
										Unassigned
									</span>
								{/if}
							</div>

							<div class="bc-meta-compact">
								<div class="meta-icon-item date-col">
									<Calendar size={14} color="var(--s-accent-2)" />
									<span class="meta-val">{formatDate(booking.date)}</span>
								</div>
								<div class="meta-icon-item time-col">
									<Clock size={14} color="var(--s-accent-teal)" />
									<span class="meta-val">{formatTime12h(booking.time)}</span>
								</div>
								{#if booking.servicesList?.some((s: any) => s.duration)}
									<div class="meta-icon-item duration-col">
										<Timer size={14} color="var(--s-accent-3)" />
										<span class="meta-val">{formatDuration(booking.servicesList.reduce((a: number, s: any) => a + (s.duration || 0), 0))}</span>
									</div>
								{/if}
							</div>



							{#if booking.payment}
								<div class="card-payment-bar">
									<span class="payment-badge {getPaymentBadgeClass(booking)}">
										{getPaymentMethodIcon(booking)}
										{getPaymentLabel(booking)}
									</span>
									<span class="payment-price">₹{booking.totalAmount || booking.price || '-'}</span>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- FAB -->
	<button
		class="fab"
		onclick={() => {
			modalMode = 'create';
			selectedBooking = null;
			isModalOpen = true;
		}}
		aria-label="New booking"
	>
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linecap="round"
		>
			<line x1="12" y1="5" x2="12" y2="19"></line>
			<line x1="5" y1="12" x2="19" y2="12"></line>
		</svg>
	</button>
</div>

<BookingModal
	bind:isOpen={isModalOpen}
	mode={modalMode}
	existingBooking={selectedBooking}
	onClose={() => (isModalOpen = false)}
/>

<ClientDrawer
	bind:isOpen={isDrawerOpen}
	userId={drawerUserId}
	userName={drawerUserName}
	userPhone={drawerUserPhone}
	userEmail={drawerUserEmail}
/>

<style>
	.bookings-page {
		display: flex;
		flex-direction: column;
		gap: var(--s-space-md);
	}

	/* Search */
	.search-wrap {
		position: relative;
		display: flex;
		align-items: center;
		background: var(--s-bg-glass);
		backdrop-filter: var(--s-blur);
		-webkit-backdrop-filter: var(--s-blur);
		border-radius: var(--s-radius-xl);
		transition: all 0.3s var(--s-ease);
	}
	
	.search-wrap:focus-within {
		box-shadow: 0 0 0 3px var(--s-accent-bg), var(--s-shadow-sm);
	}

	.search-icon {
		position: absolute;
		left: 14px;
		color: var(--s-text-tertiary);
		pointer-events: none;
		transition: color 0.3s var(--s-ease);
	}
	
	.search-wrap:focus-within .search-icon {
		color: var(--s-accent);
	}

	.search-input {
		width: 100%;
		padding: 12px 40px 12px 42px;
		background: transparent;
		border: 1px solid var(--s-border);
		border-radius: var(--s-radius-lg);
		font-size: var(--s-text-base);
		color: var(--s-text-primary);
		outline: none;
		transition: all var(--s-duration-fast) var(--s-ease);
	}

	.search-input:focus {
		border-color: var(--s-accent);
	}

	.search-input::placeholder {
		color: var(--s-text-tertiary);
	}

	.search-clear {
		position: absolute;
		right: 12px;
		background: var(--s-bg-tertiary);
		border: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		font-size: 0.7rem;
		color: var(--s-text-secondary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Filters */
	.filter-pills {
		display: flex;
		gap: var(--s-space-sm);
		overflow-x: auto;
		padding: 2px 0;
	}

	.filter-pill {
		flex-shrink: 0;
		padding: 7px 14px;
		background: var(--s-surface);
		border: 1px solid var(--s-border);
		border-radius: var(--s-radius-full);
		font-size: var(--s-text-sm);
		font-weight: 600;
		color: var(--s-text-secondary);
		cursor: pointer;
		transition: all var(--s-duration-fast) var(--s-ease);
		display: flex;
		align-items: center;
		gap: 4px;
		white-space: nowrap;
		position: relative;
		overflow: hidden;
	}
	
	.filter-pill.active {
		color: white;
		background: var(--s-grad-accent, var(--s-accent));
		border-color: transparent;
		box-shadow: 0 4px 14px rgba(232, 167, 48, 0.35);
		transform: scale(1.02);
	}
	
	:global(.staff-app.dark) .filter-pill.active {
		color: #ffffff;
	}

	.filter-pill:not(.active):active {
		transform: scale(0.95);
	}

	.pill-badge {
		background: white;
		color: var(--s-brand);
		width: 18px;
		height: 18px;
		border-radius: 50%;
		font-size: 0.6rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		animation: s-scaleIn 0.3s var(--s-ease-spring);
	}

	.filter-pill.active .pill-badge {
		background: rgba(255, 255, 255, 0.4);
		color: white;
	}
	
	:global(.staff-app.dark) .filter-pill.active .pill-badge {
		background: rgba(0, 0, 0, 0.2);
		color: #1a1a2e;
	}

	/* Results */
	.results-bar {
		padding: 0 2px;
	}

	.results-count {
		font-size: var(--s-text-xs);
		font-weight: 600;
		color: var(--s-text-tertiary);
		background: var(--s-bg-tertiary);
		padding: 3px 10px;
		border-radius: var(--s-radius-full);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Date Group */
	.date-group {
		display: flex;
		flex-direction: column;
		gap: var(--s-space-sm);
	}

	.date-divider {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: var(--s-space-sm);
	}

	.dd-label {
		font-family: var(--s-font-display);
		font-size: var(--s-text-sm);
		font-weight: 700;
		color: var(--s-text-primary);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 4px 14px;
		background: var(--s-bg-glass);
		backdrop-filter: var(--s-blur);
		-webkit-backdrop-filter: var(--s-blur);
		border-radius: var(--s-radius-full);
		border: 1px solid var(--s-border);
	}

	.dd-count {
		font-size: var(--s-text-xs);
		background: var(--s-bg-tertiary);
		padding: 2px 8px;
		border-radius: var(--s-radius-full);
		font-weight: 600;
		color: var(--s-text-secondary);
	}

	/* ═══════════════════════════════════════════
	   ACTIVE SERVICE TIMER (In-Progress Cards)
	   ═══════════════════════════════════════════ */
	.booking-card.active-service-mode {
		background: var(--s-surface);
		border: 2px solid var(--s-accent);
		box-shadow: var(--s-shadow-glow);
		animation: s-scaleIn 0.4s var(--s-ease-spring);
	}

	.active-service-content {
		padding: var(--s-space-lg);
	}

	.service-timer-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--s-space-md);
	}

	.timer-info {
		flex: 1;
		min-width: 0;
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
	.bc-phone {
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

	/* ═══════════════════════════════════════════
	   BOOKING CARD — Premium Elevated Design
	   ═══════════════════════════════════════════ */
	.bookings-list .booking-card {
		animation: s-fadeInUp 0.4s var(--s-ease-spring) backwards;
	}
	.date-group:nth-child(1) .booking-card:nth-child(1) { animation-delay: 0ms; }
	.date-group:nth-child(1) .booking-card:nth-child(2) { animation-delay: 80ms; }
	.date-group:nth-child(1) .booking-card:nth-child(3) { animation-delay: 160ms; }
	.date-group:nth-child(2) .booking-card:nth-child(1) { animation-delay: 240ms; }
	.date-group:nth-child(2) .booking-card:nth-child(2) { animation-delay: 320ms; }

	.booking-card {
		display: flex;
		overflow: hidden;
		position: relative;
		border-radius: var(--s-radius-xl);
		background: var(--s-surface);
		border: 1px solid rgba(0, 0, 0, 0.04);
		box-shadow: 
			0 15px 35px -5px rgba(0, 0, 0, 0.12), 
			0 5px 15px rgba(0, 0, 0, 0.05),
			0 2px 5px rgba(0, 0, 0, 0.03);
		transition: transform var(--s-duration-normal) var(--s-ease);
	}
	:global(.staff-app.dark) .booking-card {
		background: var(--s-surface-raised);
		border-color: rgba(255, 255, 255, 0.06);
		box-shadow: 
			0 15px 35px -5px rgba(0, 0, 0, 0.5), 
			0 5px 15px rgba(0, 0, 0, 0.3);
	}
	.booking-card:active {
		transform: scale(0.985);
	}

	/* ── Status Left Accent Bar ── */
	.card-pending,
	.card-confirmed,
	.card-in-progress,
	.card-completed,
	.card-cancelled {
		padding-left: 4px;
	}
	.card-pending::before,
	.card-confirmed::before,
	.card-in-progress::before,
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

	.card-in-progress {
		background: var(--s-in-progress-bg);
		border-color: var(--s-border);
	}
	.card-in-progress::before {
		background: var(--s-in-progress);
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

	.bc-body {
		flex: 1;
		min-width: 0;
		padding: var(--s-space-lg);
	}

	.bc-top {
		display: flex;
		align-items: flex-start;
		gap: var(--s-space-md);
	}

	.bc-avatar {
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
		border: none;
		cursor: pointer;
		transition: transform var(--s-duration-fast) var(--s-ease);
	}

	.bc-avatar:active {
		transform: scale(0.9);
	}

	.bc-info {
		flex: 1;
		min-width: 0;
	}

	.bc-name {
		margin: 0;
		font-family: var(--s-font-display);
		font-size: var(--s-text-md);
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.bc-services {
		margin: 2px 0 0;
		font-size: var(--s-text-sm);
		color: var(--s-text-secondary);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		word-break: break-word;
	}

	.bc-meta-compact {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		align-items: center;
		background: transparent;
		padding: 4px 0;
		border-radius: 0;
		border: none;
		margin-top: 4px;
	}

	.meta-icon-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.date-col {
		justify-content: center;
	}

	.time-col {
		justify-content: center;
	}

	.duration-col {
		justify-content: center;
	}

	.meta-dot {
		color: var(--s-text-tertiary);
		font-size: 0.8rem;
		font-weight: 700;
	}

	.meta-val {
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--s-text-primary);
	}

	/* ── Payment Info ── */
	/* --- PAYMENT BAR --- */
	.card-payment-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 4px 0;
		border-radius: 0;
		background: transparent;
		border: none;
		border-top: 1px dashed rgba(120, 120, 128, 0.15);
		margin-top: 6px;
		padding-top: 8px;
	}

	.payment-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 100px;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.payment-price {
		font-weight: 700;
		font-size: 0.95rem;
		color: var(--s-text-primary);
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

	.bc-actions {
		display: flex;
		gap: var(--s-space-md);
		margin-top: var(--s-space-md);
	}

	/* Premium Action Buttons */
	.bk-btn {
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
		color: white;
	}
	.bk-btn:active {
		transform: scale(0.97);
	}

	.bk-btn-confirm {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
	}
	@media (hover: hover) {
		.bk-btn-confirm:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
		}
	}

	.bk-btn-decline {
		flex: 0.5;
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
	}
	@media (hover: hover) {
		.bk-btn-decline:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
		}
	}

	.bk-btn-start {
		background: linear-gradient(135deg, var(--s-accent) 0%, var(--s-accent-dark, #b08d4f) 100%);
		box-shadow: 0 2px 8px rgba(201, 169, 110, 0.2);
		position: relative;
		overflow: hidden;
	}
	.bk-btn-start::after {
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
		.bk-btn-start:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(201, 169, 110, 0.3);
		}
	}

	.bk-btn-complete {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
	}
	@media (hover: hover) {
		.bk-btn-complete:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
		}
	}

	:global(.staff-app.dark) .bk-btn-confirm,
	:global(.staff-app.dark) .bk-btn-decline,
	:global(.staff-app.dark) .bk-btn-start,
	:global(.staff-app.dark) .bk-btn-complete {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	/* FAB */
	.fab {
		position: fixed;
		bottom: calc(var(--s-nav-height, 68px) + 16px);
		right: 16px;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--s-grad-accent, var(--s-brand));
		color: white;
		border: none;
		box-shadow: 0 4px 12px rgba(232, 167, 48, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 50;
		transition: all 0.3s var(--s-ease-spring);
	}

	:global(.staff-app.dark) .fab {
		background: var(--s-accent);
		color: #ffffff;
	}

	.fab:active {
		transform: scale(0.9);
		box-shadow: var(--s-shadow-xl);
	}

	/* Done Today Section */
	.done-today-section {
		margin-top: var(--s-space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--s-space-sm);
	}

	.done-divider {
		padding-top: var(--s-space-md);
		border-top: 1px dashed var(--s-border);
	}

	.done-card {
		opacity: 0.75;
		transition: opacity 0.2s ease;
	}

	.done-card:hover {
		opacity: 1;
	}

	.no-upcoming-msg {
		text-align: center;
		color: var(--s-text-tertiary);
		font-size: var(--s-text-sm);
		padding: var(--s-space-md) 0;
		font-style: italic;
	}

	.bc-badges {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4px;
		flex-shrink: 0;
	}

	.bc-notes {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin-top: var(--s-space-sm);
		padding: 8px 12px;
		background: var(--s-bg-secondary);
		border-radius: var(--s-radius-md);
		border-left: 2px solid var(--s-border-strong);
	}
	:global(.staff-app.dark) .bc-notes {
		background: rgba(255, 255, 255, 0.03);
		border-left-color: rgba(255, 255, 255, 0.1);
	}
	.bc-notes-icon {
		font-size: 0.8rem;
		margin-top: 2px;
	}
	.bc-notes-text {
		font-size: var(--s-text-sm);
		color: var(--s-text-secondary);
		font-style: italic;
		line-height: 1.4;
	}

	.pay-tag {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 99px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.pay-tag.paid {
		background: #dcfce7;
		color: #15803d;
		border: 1px solid #bbf7d0;
	}

	.pay-tag.unpaid {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	/* ── Staff Assignment Row ── */
	.bc-staff-row {
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

	.bk-btn-claim {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
		box-shadow: 0 2px 10px rgba(245, 158, 11, 0.3) !important;
	}
	@media (hover: hover) {
		.bk-btn-claim:hover {
			box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4) !important;
		}
	}
</style>
