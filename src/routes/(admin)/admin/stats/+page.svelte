<script lang="ts">
	import { allUsers, allBookings, getUserDisplayName, getUserPhoto, type AppUser, type Booking } from '$lib/stores/adminData';
	import { Search, ChevronRight, BarChart2, TrendingUp, Users } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';

	// Filters
	type FilterPeriod = 'today' | 'week' | 'month' | 'all';
	let selectedPeriod = $state<FilterPeriod>('today');
	let searchQuery = $state('');

	// Date calculations
	const now = new Date();
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const startOfWeek = new Date(startOfToday);
	startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday as start
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	// Filter bookings based on selected period
	let periodBookings = $derived(
		$allBookings.filter((b) => {
			if (b.status !== 'completed') return false;
			if (selectedPeriod === 'all') return true;
			const bDate = new Date(b.completedAt || b.date || 0);
			if (selectedPeriod === 'today') return bDate >= startOfToday;
			if (selectedPeriod === 'week') return bDate >= startOfWeek;
			if (selectedPeriod === 'month') return bDate >= startOfMonth;
			return true;
		})
	);

	// Total Salon Stats
	let totalSalonRevenue = $derived(
		periodBookings.reduce((sum, b) => sum + (b.totalAmount || b.price || 0), 0)
	);
	
	let totalSalonServices = $derived(
		periodBookings.reduce((count, b) => {
			if (b.servicesList && Array.isArray(b.servicesList)) return count + b.servicesList.length;
			if (b.services) return count + b.services.split(',').length;
			return count + 1;
		}, 0)
	);

	// Staff Stats Calculation
	let staffData = $derived(() => {
		const staffList = $allUsers.filter((u) => u.role === 'admin' || u.role === 'staff');
		
		return staffList.map(staff => {
			const staffBookings = periodBookings.filter(b => b.staffId === staff.id);
			
			const revenue = staffBookings.reduce((sum, b) => sum + (b.totalAmount || b.price || 0), 0);
			const servicesCount = staffBookings.reduce((count, b) => {
				if (b.servicesList && Array.isArray(b.servicesList)) return count + b.servicesList.length;
				if (b.services) return count + b.services.split(',').length;
				return count + 1;
			}, 0);
			
			return {
				user: staff,
				revenue,
				servicesCount,
				bookingsCount: staffBookings.length
			};
		});
	});

	// Filtering & Sorting (Leaderboard)
	let filteredStaff = $derived(
		staffData().filter((item) => {
			if (!searchQuery) return true;
			const q = searchQuery.toLowerCase();
			return (
				(item.user.displayName || '').toLowerCase().includes(q) ||
				(item.user.email || '').toLowerCase().includes(q) ||
				(item.user.phone || '').toLowerCase().includes(q) ||
				(item.user.specialty || '').toLowerCase().includes(q)
			);
		}).sort((a, b) => {
			// Sort by Revenue (highest first)
			if (b.revenue !== a.revenue) return b.revenue - a.revenue;
			// Then by completed bookings
			if (b.servicesCount !== a.servicesCount) return b.servicesCount - a.servicesCount;
			// Then alphabetical
			return getUserDisplayName(a.user).localeCompare(getUserDisplayName(b.user));
		})
	);

	// Helper for default avatars
	function getAvatarColor(name: string) {
		const colors = ['#007AFF', '#34C759', '#FF9F0A', '#FF3B30', '#5856D6', '#FF2D55'];
		let hash = 0;
		for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
		return colors[Math.abs(hash) % colors.length];
	}

	function navigateToStats(user: AppUser) {
		goto(`/admin/staff/${user.id}/performance`);
	}
</script>

<svelte:head>
	<title>Salon Stats - Admin Dashboard</title>
</svelte:head>

<AdminHeader title="Salon Stats" />

<div class="stats-container">
	
	<!-- Time Period Filters -->
	<div class="filter-tabs">
		<button class:active={selectedPeriod === 'today'} onclick={() => selectedPeriod = 'today'}>Today</button>
		<button class:active={selectedPeriod === 'week'} onclick={() => selectedPeriod = 'week'}>Week</button>
		<button class:active={selectedPeriod === 'month'} onclick={() => selectedPeriod = 'month'}>Month</button>
		<button class:active={selectedPeriod === 'all'} onclick={() => selectedPeriod = 'all'}>All</button>
	</div>

	<!-- Salon Overview Cards -->
	<div class="overview-grid">
		<div class="overview-card highlight">
			<div class="oc-icon"><TrendingUp size={24} /></div>
			<div class="oc-info">
				<span class="oc-val">₹{totalSalonRevenue.toLocaleString()}</span>
				<span class="oc-lbl">Salon Revenue</span>
			</div>
		</div>
		<div class="overview-card neutral">
			<div class="oc-icon"><BarChart2 size={24} /></div>
			<div class="oc-info">
				<span class="oc-val">{totalSalonServices}</span>
				<span class="oc-lbl">Completed Services</span>
			</div>
		</div>
	</div>

	<!-- Search Bar -->
	<div class="admin-search-bar" style="margin: 24px 0;">
		<div style="position: relative;">
			<Search size={16} class="admin-search-icon" />
			<input
				type="text"
				placeholder="Search staff members..."
				bind:value={searchQuery}
			/>
		</div>
	</div>

	<!-- Leaderboard Table/List -->
	<div class="leaderboard-section">
		<div class="lb-header">
			<div class="lb-col-rank"></div>
			<div class="lb-col-staff">Staff Member</div>
			<div class="lb-col-metric">Svcs</div>
			<div class="lb-col-metric rev-col">Revenue</div>
			<div class="lb-col-arrow"></div>
		</div>

		{#if filteredStaff.length === 0}
			<div class="admin-empty-state">
				<Users size={42} color="var(--admin-text-tertiary)" />
				<p>{searchQuery ? 'No staff matched your search.' : 'No staff data available for this period.'}</p>
			</div>
		{:else}
			<div class="lb-list">
				{#each filteredStaff as item, index}
					{@const name = getUserDisplayName(item.user)}
					{@const photo = getUserPhoto(item.user)}
					
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="lb-row" onclick={() => navigateToStats(item.user)}>
						<div class="lb-rank" class:top-3={index < 3}>
							{index + 1}
						</div>
						
						<div class="lb-staff-info">
							{#if photo}
								<img src={photo} alt={name} class="staff-avatar" />
							{:else}
								<div class="staff-avatar fallback" style="background: {getAvatarColor(name)};">
									{name.charAt(0).toUpperCase()}
								</div>
							{/if}
							<div class="staff-text">
								<h4>{name}</h4>
								<span class="role-badge" class:admin={item.user.role === 'admin'}>
									{item.user.role === 'admin' ? 'Admin' : 'Staff'}
								</span>
							</div>
						</div>
						
						<div class="metric-box svcs">
							{item.servicesCount}
						</div>
						<div class="metric-box rev">
							₹{item.revenue.toLocaleString()}
						</div>
						<div class="row-arrow-wrap">
							<ChevronRight size={18} color="var(--admin-text-tertiary)" class="row-arrow" />
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.stats-container {
		max-width: 800px;
		margin: 0 auto;
		padding-bottom: 90px;
	}

	/* Filter Tabs */
	.filter-tabs {
		display: flex;
		padding: 4px;
		border-radius: 100px;
		background: var(--admin-surface);
		border: 1px solid var(--admin-border);
		margin-bottom: 20px;
	}
	.filter-tabs button {
		flex: 1;
		padding: 10px;
		border: none;
		background: transparent;
		color: var(--admin-text-secondary);
		font-weight: 600;
		font-size: 0.85rem;
		border-radius: 100px;
		transition: all 0.2s;
	}
	.filter-tabs button.active {
		background: var(--admin-accent-light);
		color: var(--admin-accent);
		box-shadow: 0 2px 8px rgba(0,0,0,0.05);
	}

	/* Overview Cards */
	.overview-grid {
		display: flex;
		gap: 12px;
	}
	.overview-card {
		flex: 1;
		display: flex;
		align-items: center;
		padding: 16px;
		border-radius: var(--admin-radius-lg);
		gap: 12px;
		background: var(--admin-surface);
	}
	.overview-card.highlight {
		background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.02));
		border: 1px solid rgba(124, 58, 237, 0.2);
	}
	.overview-card.highlight .oc-icon { color: #7c3aed; background: rgba(124, 58, 237, 0.1); }
	
	.overview-card.neutral {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02));
		border: 1px solid rgba(16, 185, 129, 0.2);
	}
	.overview-card.neutral .oc-icon { color: #10b981; background: rgba(16, 185, 129, 0.1); }
	
	.oc-icon {
		width: 42px;
		height: 42px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	
	.oc-info {
		display: flex;
		flex-direction: column;
	}
	.oc-val {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--admin-text-primary);
		line-height: 1.2;
	}
	.oc-lbl {
		font-size: 0.75rem;
		color: var(--admin-text-secondary);
		font-weight: 500;
	}

	/* Leaderboard Table */
	.leaderboard-section {
		background: var(--admin-surface);
		border-radius: var(--admin-radius-lg);
		border: 1px solid var(--admin-border);
		overflow: hidden;
		margin-top: 24px;
	}
	
	.lb-header, .lb-row {
		display: grid;
		grid-template-columns: 24px 1fr 44px 76px 20px;
		align-items: center;
		gap: 12px;
	}

	.lb-header {
		padding: 18px 16px 14px 16px;
		border-bottom: 1px solid var(--admin-border);
		background: var(--admin-surface-hover);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--admin-text-tertiary);
	}
	
	.lb-col-metric {
		text-align: right;
	}
	
	.lb-row {
		padding: 18px 16px;
		border-bottom: 1px solid var(--admin-border);
		cursor: pointer;
		transition: background 0.2s ease;
	}
	.lb-row:last-child {
		border-bottom: none;
	}
	.lb-row:hover {
		background: var(--admin-surface-hover);
	}

	.lb-rank {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--admin-text-tertiary);
		text-align: center;
	}
	.lb-rank.top-3 {
		color: var(--admin-accent);
	}

	.lb-staff-info {
		display: flex;
		align-items: center;
		gap: 14px;
		min-width: 0; /* for text truncation if needed */
	}

	.staff-avatar {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.staff-avatar.fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-weight: 700;
		font-size: 1.15rem;
	}

	.staff-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		overflow: hidden;
	}
	.staff-text h4 {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--admin-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.role-badge {
		font-size: 0.6rem;
		font-weight: 600;
		padding: 2px 6px;
		border-radius: 100px;
		background: var(--admin-surface-hover);
		color: var(--admin-text-secondary);
		align-self: flex-start;
	}
	.role-badge.admin {
		background: var(--admin-accent-light);
		color: var(--admin-accent);
	}

	.metric-box {
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--admin-text-primary);
		text-align: right;
	}
	.metric-box.svcs {
		color: var(--admin-text-secondary);
	}
	.metric-box.rev {
		color: #10b981; /* Green for money */
	}
	
	.row-arrow-wrap {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}
	.row-arrow {
		opacity: 0.5;
	}
</style>
