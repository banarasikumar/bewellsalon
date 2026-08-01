<script lang="ts">
	import type { Booking, AppUser } from '$lib/stores/adminData';
	import { getUserPhoto, getUserPhone } from '$lib/stores/adminData';
	import { goto } from '$app/navigation';
	import { db } from '$lib/firebase';
	import { doc, updateDoc } from 'firebase/firestore';

	let isEditingCommission = $state(false);
	let editCommissionValue = $state(0);

	function startEditingCommission() {
		editCommissionValue = Number(commissionRate) || 0;
		isEditingCommission = true;
	}
	
	async function saveCommission() {
		if (!staff) return;
		try {
			await updateDoc(doc(db, 'users', staff.id), {
				commissionRate: editCommissionValue,
				commission: editCommissionValue
			});
			isEditingCommission = false;
		} catch(err) {
			console.error('Failed to update commission:', err);
		}
	}

	// Helper for default avatars
	function getAvatarColor(name: string) {
		const colors = ['#007AFF', '#34C759', '#FF9F0A', '#FF3B30', '#5856D6', '#FF2D55'];
		let hash = 0;
		for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
		return colors[Math.abs(hash) % colors.length];
	}

	interface Props {
		bookings?: Booking[];
		staff?: AppUser | null;
		settingsUrl?: string;
		backUrl?: string;
		title?: string;
		showHeader?: boolean;
	}

	let { 
		bookings = [], 
		staff = null, 
		settingsUrl = '', 
		backUrl = '', 
		title = 'My Stats',
		showHeader = true
	}: Props = $props();

	// Filters
	type FilterPeriod = 'today' | 'week' | 'month' | 'all';
	let selectedPeriod = $state<FilterPeriod>('today');

	// Date calculations
	const now = new Date();
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	
	const startOfWeek = new Date(startOfToday);
	startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday as start

	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	// Filter bookings based on selected period
	let filteredBookings = $derived(
		bookings.filter((b) => {
			if (selectedPeriod === 'all') return true;
			const bDate = new Date(b.completedAt || b.date || 0);
			if (selectedPeriod === 'today') return bDate >= startOfToday;
			if (selectedPeriod === 'week') return bDate >= startOfWeek;
			if (selectedPeriod === 'month') return bDate >= startOfMonth;
			return true;
		})
	);

	// Derived metrics
	let revenue = $derived(
		filteredBookings.reduce((sum, b) => sum + (b.totalAmount || b.price || 0), 0)
	);
	
	// Assuming a default commission rate if not explicitly set on the user. We will use a standard 20% or if user has it, use theirs.
	let isCommissionEnabled = $derived(staff?.commissionEnabled !== false);
	let commissionRate = $derived(staff?.commission || staff?.commissionRate || 20);
	let commission = $derived(isCommissionEnabled ? ((revenue * Number(commissionRate)) / 100) : 0);

	let clients = $derived(
		new Set(filteredBookings.map((b) => b.userId || b.userPhone || b.userName)).size
	);
	
	let servicesCount = $derived(
		filteredBookings.reduce((count, b) => {
			if (b.servicesList && Array.isArray(b.servicesList)) return count + b.servicesList.length;
			if (b.services) return count + b.services.split(',').length;
			return count + 1;
		}, 0)
	);

	let avgTime = $derived(() => {
		const withDuration = filteredBookings.filter((b) => b.activeDuration);
		if (withDuration.length === 0) return 0;
		const total = withDuration.reduce((s, b) => s + (b.activeDuration || 0), 0);
		return Math.round(total / withDuration.length);
	});

	// Data for Revenue Chart (Daily breakdown)
	let chartData = $derived(() => {
		if (selectedPeriod === 'today') {
			// Hourly breakdown
			const hours = Array(12).fill(0).map((_, i) => ({ label: `${i + 9}h`, value: 0 }));
			filteredBookings.forEach((b) => {
				const d = new Date(b.completedAt || b.date || 0);
				let h = d.getHours() - 9;
				if (h >= 0 && h < 12) hours[h].value += (b.totalAmount || b.price || 0);
			});
			return hours;
		}
		
		if (selectedPeriod === 'week') {
			const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(l => ({ label: l, value: 0 }));
			filteredBookings.forEach((b) => {
				const d = new Date(b.completedAt || b.date || 0);
				days[d.getDay()].value += (b.totalAmount || b.price || 0);
			});
			return days;
		}
		
		if (selectedPeriod === 'month') {
			// Weekly breakdown in month
			const weeks = Array(4).fill(0).map((_, i) => ({ label: `W${i+1}`, value: 0 }));
			filteredBookings.forEach((b) => {
				const d = new Date(b.completedAt || b.date || 0);
				let w = Math.floor(d.getDate() / 8);
				if (w > 3) w = 3;
				weeks[w].value += (b.totalAmount || b.price || 0);
			});
			return weeks;
		}
		
		// All time (Monthly breakdown)
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(l => ({ label: l, value: 0 }));
		filteredBookings.forEach((b) => {
			const d = new Date(b.completedAt || b.date || 0);
			months[d.getMonth()].value += (b.totalAmount || b.price || 0);
		});
		return months;
	});

	let maxChartValue = $derived(Math.max(...chartData().map(d => d.value), 100));

	// Format helpers
	function formatTime(dStr: string) {
		if (!dStr) return '';
		const d = new Date(dStr);
		let h = d.getHours();
		let ampm = h >= 12 ? 'PM' : 'AM';
		h = h % 12 || 12;
		let m = d.getMinutes().toString().padStart(2, '0');
		return `${h}:${m} ${ampm}`;
	}
	
	function formatDate(dStr: string) {
		if (!dStr) return '';
		return new Date(dStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function goToSettings() {
		if (settingsUrl) goto(settingsUrl);
	}
	
	function goBack() {
		if (backUrl) goto(backUrl);
		else window.history.back();
	}
</script>

<div class="performance-page" class:staff-app={!staff}>
	{#if showHeader}
		<header class="perf-header">
			<div class="header-content">
				<div class="header-left">
					{#if backUrl}
						<button class="icon-btn back-btn" onclick={goBack}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<line x1="19" y1="12" x2="5" y2="12"></line>
								<polyline points="12 19 5 12 12 5"></polyline>
							</svg>
						</button>
					{/if}
					<h1>{title}</h1>
				</div>
				
				{#if settingsUrl}
					<button class="icon-btn settings-btn" onclick={goToSettings}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="3"></circle>
							<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
						</svg>
					</button>
				{/if}
			</div>
		</header>
	{/if}

	<div class="perf-content">
		<!-- Profile Section -->
		{#if staff}
			{@const photo = getUserPhoto(staff)}
			{@const phone = getUserPhone(staff)}
			{@const staffNameStr = staff.displayName || staff.name || staff.fullName || 'Staff Member'}
			<div class="staff-profile-card s-glass">
				<div class="sp-avatar-wrap">
					{#if photo}
						<img src={photo} alt={staffNameStr} class="sp-avatar" />
					{:else}
						<div class="sp-avatar fallback" style="background: {getAvatarColor(staffNameStr)};">
							{staffNameStr.charAt(0).toUpperCase()}
						</div>
					{/if}
				</div>
				<div class="sp-details">
					<h2>{staffNameStr}</h2>
					<span class="role-badge" class:admin={staff.role === 'admin'}>
						{staff.role === 'admin' ? 'Admin' : 'Staff'}
					</span>
					<div class="sp-contact">
						{#if staff.email}
							<div class="contact-item">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
								<span>{staff.email}</span>
							</div>
						{/if}
						{#if phone}
							<div class="contact-item">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
								<span>{phone}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Filter Tabs -->
		<div class="filter-tabs s-glass">
			<button class:active={selectedPeriod === 'today'} onclick={() => selectedPeriod = 'today'}>Today</button>
			<button class:active={selectedPeriod === 'week'} onclick={() => selectedPeriod = 'week'}>Week</button>
			<button class:active={selectedPeriod === 'month'} onclick={() => selectedPeriod = 'month'}>Month</button>
			<button class:active={selectedPeriod === 'all'} onclick={() => selectedPeriod = 'all'}>All</button>
		</div>

		<!-- Summary Cards -->
		<div class="summary-grid">
			<div class="stat-card s-glass highlight">
				<div class="stat-icon">💰</div>
				<div class="stat-info">
					<span class="stat-val">₹{revenue}</span>
					<span class="stat-lbl">Revenue</span>
				</div>
			</div>
			<div class="stat-card s-glass commission" style={!isCommissionEnabled ? 'opacity: 0.7;' : ''}>
				<div class="stat-icon">💵</div>
				<div class="stat-info">
					<span class="stat-val">₹{commission.toFixed(0)}</span>
					{#if isCommissionEnabled}
						<span class="stat-lbl">Commission ({commissionRate}%)</span>
					{:else}
						<span class="stat-lbl">Commission (Disabled)</span>
					{/if}
				</div>
			</div>
			
			<div class="stat-row">
				<div class="stat-mini s-glass">
					<span class="mini-val">{clients}</span>
					<span class="mini-lbl">Clients</span>
				</div>
				<div class="stat-mini s-glass">
					<span class="mini-val">{servicesCount}</span>
					<span class="mini-lbl">Services</span>
				</div>
				<div class="stat-mini s-glass">
					<span class="mini-val">{avgTime()}m</span>
					<span class="mini-lbl">Avg Time</span>
				</div>
			</div>
		</div>

		<!-- Chart Section -->
		<div class="chart-section s-glass">
			<h3>Revenue Trend</h3>
			<div class="chart-container">
				<div class="chart-bars">
					{#each chartData() as d}
						<div class="bar-wrap">
							<div class="bar-value">₹{d.value}</div>
							<div class="bar" style="height: {(d.value / maxChartValue) * 100}%" class:empty={d.value === 0}></div>
							<div class="bar-label">{d.label}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- History List -->
		<div class="history-section">
			<h3>Completed Services</h3>
			{#if filteredBookings.length === 0}
				<div class="empty-state">
					<div class="empty-icon">📂</div>
					<p>No completed services for this period.</p>
				</div>
			{:else}
				<div class="history-list">
					{#each filteredBookings as booking}
						<div class="history-card s-glass">
							<div class="hc-header">
								<div class="hc-client">
									<div class="hc-avatar">{booking.userName?.charAt(0) || 'C'}</div>
									<div class="hc-name">{booking.userName || 'Client'}</div>
								</div>
								<div class="hc-revenue">₹{booking.totalAmount || booking.price || 0}</div>
							</div>
							<div class="hc-body">
								<div class="hc-services">
									{#if booking.servicesList && Array.isArray(booking.servicesList)}
										{booking.servicesList.map((s: any) => s.name).join(', ')}
									{:else if booking.serviceName}
										{booking.serviceName}
									{:else if booking.services}
										{booking.services}
									{:else}
										General Service
									{/if}
								</div>
								<div class="hc-meta">
									<span>📅 {formatDate(booking.completedAt || booking.date)}</span>
									<span>⏱ {formatTime(booking.completedAt || booking.time)}</span>
									{#if booking.activeDuration}
										<span class="hc-dur">{booking.activeDuration}m</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.performance-page {
		min-height: 100vh;
		background: var(--s-bg-gradient);
		padding-bottom: 90px;
	}

	.perf-header {
		position: sticky;
		top: 0;
		z-index: 100;
		background: var(--s-bg-glass);
		backdrop-filter: var(--s-blur);
		-webkit-backdrop-filter: var(--s-blur);
		padding: 16px 20px;
		border-bottom: 1px solid var(--s-border);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 600px;
		margin: 0 auto;
	}
	
	.header-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.header-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}
	
	.header-avatar.fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-weight: 700;
		font-size: 1rem;
	}

	.header-content h1 {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0;
		color: var(--admin-text-primary, var(--s-text, #1c1c1e));
		font-family: var(--admin-font-primary, var(--font-body, sans-serif));
		letter-spacing: 0;
		text-transform: none;
	}

	.perf-content h2, .perf-content h3 {
		font-family: var(--admin-font-primary, var(--font-body, sans-serif));
		letter-spacing: 0;
		text-transform: none;
	}

	.icon-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: none;
		background: var(--s-surface-2);
		color: var(--s-text);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
	}
	.icon-btn:active { transform: scale(0.9); }
	.icon-btn svg { width: 20px; height: 20px; }
	
	.back-btn {
		background: transparent;
		color: var(--s-text);
		padding: 0;
		width: 32px;
		height: 32px;
	}

	.perf-content {
		padding: 16px;
		max-width: 600px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	/* Profile Card */
	.staff-profile-card {
		display: flex;
		align-items: center;
		padding: 24px 20px;
		border-radius: var(--admin-radius-lg, 24px);
		background: var(--admin-surface, #fff);
		margin-bottom: 24px;
		gap: 20px;
		border: 1px solid var(--admin-border, #eee);
	}
	
	.sp-avatar-wrap {
		flex-shrink: 0;
	}
	
	.sp-avatar {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		object-fit: cover;
		box-shadow: 0 4px 12px rgba(0,0,0,0.08);
	}
	
	.sp-avatar.fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-weight: 700;
		font-size: 2rem;
	}
	
	.sp-details {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	
	.sp-details h2 {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--admin-text-primary, #111);
		margin: 0 0 4px 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.role-badge {
		align-self: flex-start;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 4px 10px;
		border-radius: 100px;
		background: var(--admin-surface-hover, #f0f0f0);
		color: var(--admin-text-secondary, #666);
		margin-bottom: 12px;
	}
	.role-badge.admin {
		background: rgba(124, 58, 237, 0.1);
		color: #7c3aed;
	}
	
	.sp-contact {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	
	.contact-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.85rem;
		color: var(--admin-text-secondary, #666);
	}
	
	.contact-item svg {
		width: 14px;
		height: 14px;
		color: var(--admin-text-tertiary, #999);
	}

	/* Filter Tabs */
	.filter-tabs {
		display: flex;
		padding: 4px;
		border-radius: 100px;
		background: var(--s-surface-2);
	}
	.filter-tabs button {
		flex: 1;
		padding: 8px;
		border: none;
		background: transparent;
		color: var(--s-text-secondary);
		font-weight: 600;
		font-size: 0.85rem;
		border-radius: 100px;
		transition: all 0.2s;
	}
	.filter-tabs button.active {
		background: var(--s-accent-2-bg);
		color: var(--s-accent-2);
		box-shadow: 0 2px 8px rgba(0,0,0,0.05);
	}

	/* Summary Cards */
	.summary-grid {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.stat-card {
		display: flex;
		align-items: center;
		padding: 20px;
		border-radius: 20px;
		gap: 16px;
	}
	.stat-card.highlight {
		background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.02));
		border: 1px solid rgba(124, 58, 237, 0.2);
	}
	.stat-card.commission {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02));
		border: 1px solid rgba(16, 185, 129, 0.2);
	}
	
	.stat-icon {
		font-size: 2rem;
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--s-surface);
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.05);
	}
	
	.stat-info {
		display: flex;
		flex-direction: column;
	}
	.stat-val {
		font-size: 1.75rem;
		font-weight: 800;
		color: var(--s-text);
		line-height: 1.2;
	}
	.stat-lbl {
		font-size: 0.85rem;
		color: var(--s-text-secondary);
		font-weight: 500;
	}

	.stat-row {
		display: flex;
		gap: 12px;
	}
	.stat-mini {
		flex: 1;
		padding: 16px;
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}
	.mini-val {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--s-text);
	}
	.mini-lbl {
		font-size: 0.75rem;
		color: var(--s-text-tertiary);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Chart Section */
	.chart-section {
		padding: 24px 20px;
		border-radius: var(--admin-radius-lg, 24px);
		background: linear-gradient(135deg, rgba(124, 58, 237, 0.04), rgba(124, 58, 237, 0.01));
		margin-bottom: 24px;
		border: 1px solid rgba(124, 58, 237, 0.08);
	}
	.chart-section h3 {
		margin: 0 0 16px 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--s-text);
	}
	.chart-container {
		height: 180px;
		padding-top: 20px;
	}
	.chart-bars {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		height: 100%;
		gap: 8px;
	}
	.bar-wrap {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		height: 100%;
		gap: 8px;
		position: relative;
	}
	.bar-value {
		font-size: 0.65rem;
		color: var(--s-text-tertiary);
		opacity: 0;
		transform: translateY(5px);
		transition: all 0.2s;
		position: absolute;
		top: -20px;
		white-space: nowrap;
	}
	.bar-wrap:hover .bar-value {
		opacity: 1;
		transform: translateY(0);
	}
	.bar {
		width: 100%;
		max-width: 30px;
		background: var(--s-accent-2);
		border-radius: 6px 6px 0 0;
		transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.bar.empty {
		height: 4px !important;
		background: var(--s-surface-3);
	}
	.bar-label {
		font-size: 0.7rem;
		color: var(--s-text-secondary);
		font-weight: 500;
	}

	/* History Section */
	.history-section h3 {
		margin: 8px 0 16px 4px;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--s-text);
	}
	.history-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.history-card {
		padding: 16px;
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.hc-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.hc-client {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.hc-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--s-accent-bg);
		color: var(--s-accent);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.9rem;
	}
	.hc-name {
		font-weight: 600;
		color: var(--s-text);
	}
	.hc-revenue {
		font-weight: 800;
		color: var(--s-text);
		font-size: 1.1rem;
	}
	.hc-body {
		padding-left: 42px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.hc-services {
		font-size: 0.85rem;
		color: var(--s-text-secondary);
		line-height: 1.4;
	}
	.hc-meta {
		display: flex;
		gap: 12px;
		font-size: 0.75rem;
		color: var(--s-text-tertiary);
		font-weight: 500;
	}
	.hc-dur {
		background: var(--s-surface-2);
		padding: 2px 6px;
		border-radius: 4px;
		color: var(--s-text-secondary);
	}
	.empty-state {
		text-align: center;
		padding: 40px 20px;
		color: var(--s-text-tertiary);
	}
	.empty-icon {
		font-size: 3rem;
		margin-bottom: 12px;
		opacity: 0.5;
	}
</style>
