<script lang="ts">
	import { goto } from '$app/navigation';
	import { showToast } from '$lib/stores/toast';
	import {
		allBookings,
		formatFirestoreDate,
		getBookingTimestamp,
		formatRelativeTime,
		calculateCountdown,
		updateBookingStatus,
		updateBookingDetails,
		adminStaffUsers,
		type Booking
	} from '$lib/stores/adminData';
	import {
		Search,
		Calendar,
		Check,
		Ban,
		ClipboardCheck,
		Trash2,
		SquareCheck,
		Square,
		CheckSquare,
		ArrowUp,
		SlidersHorizontal,
		User,
		AlertCircle,
		Phone,
		UserMinus,
		FileText
	} from 'lucide-svelte';
	import {
		softDeleteBookings,
		recycledCount,
		initRecycleBinListener
	} from '$lib/stores/adminRecycleBin';
	import { adminUser } from '$lib/stores/adminAuth';
	import { headerActions } from '$lib/stores/adminUI';
	import { onMount } from 'svelte';

	// --- State ---
	let currentSort = $state<'createdAt' | 'date' | 'userName'>('createdAt');
	let searchQuery = $state('');
	let statusFilter = $state('all');
	let currentPage = $state(1);
	let showDateModal = $state(false);
	let dateStart = $state('');
	let dateEnd = $state('');
	const itemsPerPage = 50;

	// --- Header Actions ---
	$effect(() => {
		headerActions.set([
			{
				label: isManageMode ? 'Cancel Manage' : 'Manage Bookings',
				icon: SquareCheck,
				handler: toggleManageMode
			},
			{
				label: $recycledCount > 0 ? `Recycle Bin (${$recycledCount})` : 'Recycle Bin',
				icon: Trash2,
				handler: () => goto('/admin/recycle-bin')
			}
		]);

		return () => {
			headerActions.set([]);
		};
	});

	// --- Processing states ---
	let processingIds = $state<Record<string, 'processing' | 'vanishing'>>({});
	let confirmAction = $state<{ id: string; action: string } | null>(null);
	let confirmTimer: ReturnType<typeof setTimeout> | null = null;

	// --- Manage Mode ---
	let isManageMode = $state(false);
	let selectedIds = $state<Set<string>>(new Set());
	let isDeleting = $state(false);

	function toggleManageMode() {
		isManageMode = !isManageMode;
		if (!isManageMode) {
			selectedIds = new Set();
		}
	}

	function toggleSelect(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
	}

	function selectAll() {
		if (selectedIds.size === filteredBookings.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(filteredBookings.map((b) => b.id));
		}
	}

	async function deleteSelected() {
		if (selectedIds.size === 0) return;
		if (!confirm(`Move ${selectedIds.size} booking(s) to Recycle Bin?`)) return;
		isDeleting = true;
		try {
			const toDelete = $allBookings.filter((b) => selectedIds.has(b.id));
			console.log('[Manage] Deleting', toDelete.length, 'bookings, IDs:', [...selectedIds]);
			if (toDelete.length === 0) {
				showToast('No matching bookings found', 'error');
				isDeleting = false;
				return;
			}
			const result = await softDeleteBookings(toDelete, $adminUser?.uid || 'admin');
			console.log('[Manage] Result:', result);
			if (result.deleted > 0) {
				showToast(`Moved ${result.deleted} booking(s) to Recycle Bin`, 'success');
			}
			if (result.errors > 0) {
				showToast(`${result.errors} failed to delete`, 'error');
			}
			selectedIds = new Set();
			isManageMode = false;
		} catch (e: any) {
			console.error('[Manage] Delete failed:', e);
			showToast('Delete failed: ' + e.message, 'error');
		} finally {
			isDeleting = false;
		}
	}

	onMount(() => {
		initRecycleBinListener();
		document.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('scroll', handleScroll, { passive: true });
		// Initial check
		handleScroll();
		return () => {
			document.removeEventListener('scroll', handleScroll);
			window.removeEventListener('scroll', handleScroll);
		};
	});

	// --- Auto-cancel overdue pending bookings ---
	let autoCancelledIds = new Set<string>();
	$effect(() => {
		const now = Date.now();
		for (const b of $allBookings) {
			const s = (b.status || 'pending').toLowerCase();
			if (s !== 'pending') continue;
			if (autoCancelledIds.has(b.id)) continue;
			const ts = getBookingTimestamp(b);
			if (ts > 0 && ts < now) {
				autoCancelledIds.add(b.id);
				updateBookingStatus(b.id, 'cancelled').then(() => {
					console.log(`[Auto-Cancel] Pending booking ${b.id} auto-cancelled (appointment passed)`);
				}).catch((err) => {
					console.error(`[Auto-Cancel] Failed for ${b.id}:`, err);
					autoCancelledIds.delete(b.id);
				});
			}
		}
	});

	// --- Helper: compute display status for a booking ---
	function getDisplayStatus(booking: Booking): { label: string; cssClass: string } {
		const s = (booking.status || 'pending').toLowerCase();
		if (s === 'confirmed') {
			const ts = getBookingTimestamp(booking);
			if (ts > 0 && ts < Date.now()) {
				return { label: 'overdue', cssClass: 'overdue' };
			}
			return { label: 'confirmed', cssClass: 'confirmed' };
		}
		const cssClass = s === 'declined' ? 'cancelled' : s;
		return { label: s, cssClass };
	}

	// --- Scroll to Top ---
	let showScrollTop = $state(false);

	function handleScroll() {
		const scrollTop =
			document.documentElement.scrollTop || document.body.scrollTop || window.scrollY || 0;
		showScrollTop = scrollTop > 100;
	}

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// --- Filter Chips ---
	const activeChips = [
		{ label: 'All', value: 'all', color: 'var(--admin-accent)' },
		{ label: 'Unassigned', value: 'unassigned', color: 'var(--admin-orange)' },
		{ label: 'Pending', value: 'pending', color: 'var(--admin-orange)' },
		{ label: 'Confirmed', value: 'confirmed', color: 'var(--admin-green)' },
		{ label: 'Completed', value: 'completed', color: 'var(--admin-green)' },
		{ label: 'Cancelled', value: 'cancelled', color: 'var(--admin-red)' },
		{ label: 'Overdue', value: 'overdue', color: 'var(--admin-red)' }  // Confirmed bookings past appointment time
	];

	// --- Filtered & sorted bookings ---
	let filteredBookings = $derived.by(() => {
		const now = Date.now();
		let filtered = $allBookings.filter((b) => {
			// Include processing/vanishing items
			if (processingIds[b.id]) return true;

			const s = (b.status || 'pending').toLowerCase();

			// Status filter
			if (statusFilter !== 'all') {
				if (statusFilter === 'overdue') {
					// Overdue = confirmed bookings whose appointment time has passed
					if (s !== 'confirmed') return false;
					const ts = getBookingTimestamp(b);
					if (ts > now) return false;
				} else if (statusFilter === 'unassigned') {
					if (s === 'cancelled' || s === 'completed' || s === 'declined') return false;
					if (b.staffId && b.staffId !== 'unassigned') return false;
				} else {
					if (s !== statusFilter) return false;
				}
			}

			// Search
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				const searchStr =
					`${b.id} ${b.userName} ${b.userEmail} ${b.userPhone || ''} ${JSON.stringify(b.services || '')} ${JSON.stringify(b.servicesList || '')}`.toLowerCase();
				if (!searchStr.includes(q)) return false;
			}

			// Date range
			if (dateStart || dateEnd) {
				const ts = getBookingTimestamp(b);
				if (dateStart) {
					const startTs = new Date(dateStart).setHours(0, 0, 0, 0);
					if (ts < startTs) return false;
				}
				if (dateEnd) {
					const endTs = new Date(dateEnd).setHours(23, 59, 59, 999);
					if (ts > endTs) return false;
				}
			}

			return true;
		});

		// Sort
		filtered.sort((a, b) => {
			const sA = (a.status || 'pending').toLowerCase();
			const sB = (b.status || 'pending').toLowerCase();

			const isUnfinishedA = ['pending', 'confirmed'].includes(sA);
			const isUnfinishedB = ['pending', 'confirmed'].includes(sB);

			if (currentSort === 'createdAt') {
				const tA = a.createdAt?.seconds || new Date(a.createdAt).getTime() || 0;
				const tB = b.createdAt?.seconds || new Date(b.createdAt).getTime() || 0;
				return tB - tA;
			}
			if (currentSort === 'date') {
				return getBookingTimestamp(a) - getBookingTimestamp(b);
			}
			if (currentSort === 'userName') {
				return (a.userName || '').localeCompare(b.userName || '');
			}
			return 0;
		});

		return filtered;
	});

	let unfinishedBookings = $derived(
		filteredBookings.filter((b) =>
			['pending', 'confirmed'].includes((b.status || 'pending').toLowerCase())
		)
	);
	let historyBookings = $derived(
		filteredBookings.filter(
			(b) => !['pending', 'confirmed'].includes((b.status || 'pending').toLowerCase())
		)
	);

	// Pagination
	let totalPages = $derived(Math.ceil(historyBookings.length / itemsPerPage));
	let paginatedHistory = $derived.by(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return historyBookings.slice(start, start + itemsPerPage);
	});

	let resultText = $derived.by(() => {
		const start = (currentPage - 1) * itemsPerPage;
		const end = Math.min(start + itemsPerPage, historyBookings.length);
		return `Showing ${Math.min(start + 1, historyBookings.length)}–${end} of ${historyBookings.length} history`;
	});

	// --- Update Booking ---
	async function handleStatusUpdate(bookingId: string, newStatus: string) {
		// Native confirm dialog removed as it was blocking execution on some devices
		// logic proceeds directly

		processingIds[bookingId] = 'processing';
		processingIds = { ...processingIds };

		try {
			await updateBookingStatus(bookingId, newStatus);

			processingIds[bookingId] = 'vanishing';
			processingIds = { ...processingIds };

			const msgs: Record<string, string> = {
				completed: 'Marked as Completed',
				confirmed: 'Booking Confirmed',
				cancelled: 'Booking Cancelled'
			};
			showToast(msgs[newStatus] || 'Status Updated', 'success');

			setTimeout(() => {
				delete processingIds[bookingId];
				processingIds = { ...processingIds };
			}, 700);
		} catch (e: any) {
			console.error('Firestore update error:', e);
			delete processingIds[bookingId];
			processingIds = { ...processingIds };
			showToast('Error: ' + e.message, 'error');
		}
	}

	// --- Date Range ---
	function applyDate() {
		if (!dateStart && !dateEnd) return;
		showDateModal = false;
		currentPage = 1;
	}

	function clearDate() {
		dateStart = '';
		dateEnd = '';
		showDateModal = false;
		currentPage = 1;
	}

	// --- Service Chips ---
	function getServices(b: Booking): string[] {
		const data =
			b.servicesList || (b.service ? b.service.split(',') : b.serviceName ? [b.serviceName] : []);
		if (!Array.isArray(data)) return [];
		return data.map((s: any) =>
			typeof s === 'string' ? s.trim() : s.name || s.serviceName || 'Unknown'
		);
	}

	const chipColors = [
		{ bg: 'rgba(212, 175, 55, 0.18)', text: '#b8941e' }, // Gold
		{ bg: 'rgba(191, 90, 242, 0.18)', text: '#9b40d8' }, // Purple
		{ bg: 'rgba(48, 209, 88, 0.18)', text: '#1a9e3f' }, // Green
		{ bg: 'rgba(255, 159, 10, 0.18)', text: '#d97706' }, // Orange
		{ bg: 'rgba(255, 55, 95, 0.18)', text: '#dc2653' }, // Pink
		{ bg: 'rgba(94, 92, 230, 0.18)', text: '#4f46e5' }, // Indigo
		{ bg: 'rgba(100, 210, 255, 0.18)', text: '#0284c7' }, // Light Blue
		{ bg: 'rgba(255, 214, 10, 0.18)', text: '#a16207' } // Yellow
	];

	// --- Avatar ---
	const avatarColors = ['#FF9F0A', '#30D158', '#D4AF37', '#BF5AF2', '#FF375F', '#AC8E68'];

	function getAvatarColor(name: string): string {
		const code = (name || 'U').charCodeAt(0);
		return avatarColors[code % avatarColors.length];
	}

	function maskPhone(phone: string): string {
		if (!phone) return '';
		const digits = phone.replace(/\D/g, '');
		if (digits.length <= 5) return '*'.repeat(digits.length);
		return digits.slice(0, 3) + '*'.repeat(digits.length - 5) + digits.slice(-2);
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
		if (!mins) return '30m';
		if (mins >= 60) {
			const h = Math.floor(mins / 60);
			const m = mins % 60;
			return m > 0 ? `${h}h ${m}m` : `${h}h`;
		}
		return `${mins}m`;
	}
</script>

<!-- Manage Toolbar -->
{#if isManageMode}
	<div class="admin-manage-toolbar">
		<button class="admin-manage-select-all" onclick={selectAll}>
			{#if selectedIds.size === filteredBookings.length && filteredBookings.length > 0}
				<CheckSquare size={18} />
			{:else}
				<Square size={18} />
			{/if}
			<span>
				{selectedIds.size === filteredBookings.length && filteredBookings.length > 0
					? 'Deselect All'
					: 'Select All'}
			</span>
		</button>
		<span class="admin-manage-count">{selectedIds.size} selected</span>
		<button
			class="admin-manage-delete-btn"
			disabled={selectedIds.size === 0 || isDeleting}
			onclick={deleteSelected}
		>
			<Trash2 size={16} />
			{isDeleting ? 'Deleting...' : 'Delete'}
		</button>
	</div>
{/if}

<!-- Controls -->
<div class="admin-search-bar">
	<Search size={16} class="admin-search-icon" />
	<input
		type="text"
		placeholder="Search name, ID, service..."
		bind:value={searchQuery}
		oninput={() => (currentPage = 1)}
	/>
	<div class="admin-sort-container">
		<SlidersHorizontal size={16} class="admin-sort-icon" />
		<select class="admin-sort-select-hidden" bind:value={currentSort} aria-label="Sort bookings">
			<option value="createdAt">Recent</option>
			<option value="date">Appt. Date</option>
			<option value="userName">Client Name</option>
		</select>
	</div>
</div>

<div class="admin-filter-row">
	{#each activeChips as chip}
		<button
			class="admin-filter-chip"
			class:active={statusFilter === chip.value}
			style={statusFilter === chip.value
				? `background: ${chip.color}; border-color: ${chip.color}; color: #fff;`
				: ''}
			onclick={() => {
				statusFilter = chip.value;
				currentPage = 1;
			}}
		>
			{chip.label}
		</button>
	{/each}
	<button
		class="admin-filter-chip"
		class:active={!!dateStart}
		style={dateStart
			? 'background: var(--admin-accent); border-color: var(--admin-accent); color: #000; font-weight: 700;'
			: 'border-style: dashed;'}
		onclick={() => (showDateModal = true)}
	>
		<Calendar size={12} style="display:inline; vertical-align: middle; margin-right: 4px;" />
		{dateStart && dateEnd
			? `${new Date(dateStart).toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${new Date(dateEnd).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
			: 'Date Range'}
	</button>
</div>

<div class="admin-result-counter">
	<span>{resultText}</span>
</div>

<!-- Bookings Snippet -->
{#snippet bookingCard(booking: Booking)}
	{@const displayStatus = getDisplayStatus(booking)}
	{@const status = displayStatus.label}
	{@const statusClass = displayStatus.cssClass}
	{@const dateStr = formatFirestoreDate(booking.date)}
	{@const bookedOn = formatRelativeTime(booking.createdAt)}
	{@const countdown = calculateCountdown(booking.date, booking.time)}
	{@const services = getServices(booking)}
	{@const isProcessing = processingIds[booking.id] === 'processing'}
	{@const isVanishing = processingIds[booking.id] === 'vanishing'}
	{@const totalMins = booking.servicesList?.reduce((a: number, s: any) => a + (s.duration || 30), 0) || 30}

	<div class="admin-swipe-container" class:admin-card-vanishing={isVanishing}>
		<!-- Card -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="premium-booking-card card-{statusClass}"
			class:admin-card-selected={isManageMode && selectedIds.has(booking.id)}
			role="button"
			tabindex="0"
			onclick={() => {
				if (isManageMode) {
					toggleSelect(booking.id);
				} else {
					goto('/admin/bookings/' + booking.id);
				}
			}}
		>
			{#if isProcessing}
				<div class="admin-processing-overlay">
					<div class="admin-spinner"></div>
					<span class="admin-processing-text">Processing...</span>
				</div>
			{/if}

			<div class="pbc-header-row">
				<div style="display: flex; align-items: center; gap: 8px;">
					{#if isManageMode}
						<button
							class="admin-select-checkbox"
							class:checked={selectedIds.has(booking.id)}
							onclick={(e) => {
								e.stopPropagation();
								toggleSelect(booking.id);
							}}
						>
							{#if selectedIds.has(booking.id)}
								<CheckSquare size={20} />
							{:else}
								<Square size={20} />
							{/if}
						</button>
					{/if}
					<span class="pbc-booking-id-top">#{booking.id.slice(0, 8).toUpperCase()}</span>
				</div>
				<div class="pbc-badges">
					{#if booking.staffName && booking.staffId && booking.staffId !== 'unassigned'}
						<div class="pbc-staff-badge assigned">
							<User size={10} /> {booking.staffName}
						</div>
					{:else}
						<div class="pbc-staff-badge unassigned">
							<AlertCircle size={10} /> Unassigned
						</div>
					{/if}
					<div class="pbc-status-badge {statusClass}">
						{status.toUpperCase()}
					</div>
				</div>
			</div>

			<div class="pbc-top">
				{#if booking.userPhoto}
					<img src={booking.userPhoto} alt={booking.userName} class="pbc-avatar-img" />
				{:else}
					<div class="pbc-avatar" style="background: {getAvatarColor(booking.userName || '')};">
						{(booking.userName || 'G').charAt(0).toUpperCase()}
					</div>
				{/if}

				<div class="pbc-info">
					<h4 class="pbc-name">{booking.userName || 'Guest'}</h4>
					<p class="pbc-services">
						{#if services.length > 0}
							{services[0]} {#if services.length > 1}<span class="pbc-more-badge">+{services.length - 1}</span>{/if}
						{:else}
							Service
						{/if}
					</p>

					<p class="pbc-phone">
						<Phone size={11} /> 
						{booking.userPhone ? maskPhone(booking.userPhone) : 'No phone'}
					</p>
				</div>
			</div>

			{#if booking.notes}
				<div class="pbc-special-request">
					<div class="pbc-request-header">
						<FileText size={14} />
						<span>Special Request</span>
					</div>
					<p>{booking.notes}</p>
				</div>
			{/if}

			<div class="pbc-meta-grid pbc-meta-premium">
				<div class="pbc-meta-block">
					<span class="pbc-meta-label">Date</span>
					<span class="pbc-meta-value">{dateStr}</span>
				</div>
				<div class="pbc-meta-block">
					<span class="pbc-meta-label">Time</span>
					<span class="pbc-meta-value">{formatTime12h(booking.time)}</span>
				</div>
				<div class="pbc-meta-block">
					<span class="pbc-meta-label">Duration</span>
					<span class="pbc-meta-value">{formatDuration(totalMins)}</span>
				</div>
			</div>
		</div>
	</div>
{/snippet}

<!-- Unfinished Section -->
<div class="admin-section-title" style="margin-top: 10px; font-size: 16px;">Unfinished</div>
{#if unfinishedBookings.length === 0}
	<div class="admin-empty-state" style="padding: 24px 16px; min-height: auto; margin-bottom: 24px;">
		<Calendar size={36} color="var(--admin-text-tertiary)" />
		<p style="margin-top: 8px;">No unfinished bookings</p>
	</div>
{:else}
	{#each unfinishedBookings as booking (booking.id)}
		{@render bookingCard(booking)}
	{/each}
{/if}

<!-- History Section -->
<div class="admin-section-title" style="margin-top: 24px; font-size: 16px;">History</div>
{#if paginatedHistory.length === 0}
	<div class="admin-empty-state" style="padding: 24px 16px; min-height: auto;">
		<ClipboardCheck size={36} color="var(--admin-text-tertiary)" />
		<p style="margin-top: 8px;">No history found</p>
	</div>
{:else}
	{#each paginatedHistory as booking (booking.id)}
		{@render bookingCard(booking)}
	{/each}
{/if}

<!-- Pagination -->
{#if totalPages > 1}
	<div class="admin-pagination">
		<button
			disabled={currentPage === 1}
			onclick={() => {
				currentPage--;
			}}
		>
			Prev
		</button>
		<span>Page {currentPage} of {totalPages}</span>
		<button
			disabled={currentPage === totalPages}
			onclick={() => {
				currentPage++;
			}}
		>
			Next
		</button>
	</div>
{/if}

<!-- Date Range Modal -->
{#if showDateModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="admin-modal-overlay"
		onclick={() => (showDateModal = false)}
		role="dialog"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="admin-modal" onclick={(e) => e.stopPropagation()} role="document">
			<h3>Select Dates</h3>
			<p>Filter bookings by appointment date</p>

			<label for="date-start">From</label>
			<input type="date" id="date-start" bind:value={dateStart} />

			<label for="date-end">To</label>
			<input type="date" id="date-end" bind:value={dateEnd} />

			<div class="admin-modal-actions">
				<button class="admin-modal-btn secondary" onclick={() => (showDateModal = false)}
					>Cancel</button
				>
				<button class="admin-modal-btn primary" onclick={applyDate}>Apply</button>
			</div>
			<button class="admin-modal-clear" onclick={clearDate}>Clear Filter</button>
		</div>
	</div>
{/if}

<!-- Scroll to Top Button -->
{#if showScrollTop}
	<button class="scroll-to-top-btn" onclick={scrollToTop} aria-label="Scroll to top">
		<ArrowUp size={20} strokeWidth={2.5} />
	</button>
{/if}
<style>
	/* Premium Card Design for Admin */
	.premium-booking-card {
		position: relative;
		background: var(--admin-surface);
		border-radius: 16px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid var(--admin-border);
		transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
		cursor: pointer;
		overflow: hidden;
		margin-bottom: 12px;
	}

	.premium-booking-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
	}

	.premium-booking-card:active {
		transform: translateY(0) scale(0.98);
	}

	.premium-booking-card.admin-card-selected {
		border-color: var(--admin-accent);
		box-shadow: 0 0 0 2px var(--admin-accent-light);
	}

	/* Status Accents (Left border style) */
	.premium-booking-card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		background: var(--admin-border);
		transition: background 0.3s ease;
	}

	.card-pending::before { background: var(--admin-orange); }
	.card-confirmed::before { background: var(--admin-green); }
	.card-completed::before { background: var(--admin-indigo); }
	.card-cancelled::before { background: var(--admin-red); }
	.card-overdue::before { background: var(--admin-red); }

	/* --- NEW HEADER SECTION --- */
	.pbc-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 8px;
		border-bottom: 1px dashed rgba(120, 120, 128, 0.15);
	}

	.pbc-booking-id-top {
		font-weight: 800;
		font-size: 14px;
		font-family: 'SF Mono', 'Fira Code', monospace;
		color: var(--admin-text-primary);
		letter-spacing: 0.5px;
	}

	.pbc-badges {
		display: flex;
		gap: 6px;
		align-items: center;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.pbc-staff-badge {
		font-size: 0.65rem;
		font-weight: 800;
		padding: 4px 8px;
		border-radius: 100px;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.pbc-staff-badge.assigned {
		background: rgba(120, 120, 128, 0.1);
		color: var(--admin-text-secondary);
	}

	.pbc-staff-badge.unassigned {
		background: var(--admin-orange-light);
		color: var(--admin-orange);
		border: 1px dashed var(--admin-orange);
	}

	/* --- TOP INFO SECTION --- */
	.pbc-top {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.pbc-avatar {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		color: #fff;
		font-weight: 700;
		font-size: 1.2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}

	.pbc-avatar-img {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		object-fit: cover;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}

	.pbc-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.pbc-name-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}

	.pbc-name {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--admin-text-primary);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.pbc-status-badge {
		font-size: 0.65rem;
		font-weight: 800;
		padding: 4px 8px;
		border-radius: 100px;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.pbc-status-badge.confirmed { background: var(--admin-accent); color: #000; }
	.pbc-status-badge.pending { background: var(--admin-orange-light); color: var(--admin-orange); }
	.pbc-status-badge.completed { background: var(--admin-indigo); color: white; }
	.pbc-status-badge.cancelled { background: var(--admin-red-light); color: var(--admin-red); }
	.pbc-status-badge.overdue { background: var(--admin-red); color: white; }

	.pbc-services {
		font-size: 0.9rem;
		color: var(--admin-text-secondary);
		margin: 2px 0 0 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-weight: 500;
	}
	
	.pbc-more-badge {
		font-size: 0.7rem;
		background: rgba(120,120,128, 0.16);
		padding: 2px 6px;
		border-radius: 4px;
		color: var(--admin-text-secondary);
		margin-left: 4px;
		font-weight: 600;
	}

	.pbc-phone {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.8rem;
		color: var(--admin-text-tertiary);
		margin: 4px 0 0 0;
	}

	/* --- META GRID (Date/Time) --- */
	.pbc-meta-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		background: rgba(120, 120, 128, 0.08);
		padding: 10px 12px;
		border-radius: 12px;
		margin-top: 4px;
	}

	.pbc-meta-premium {
		background: linear-gradient(135deg, var(--admin-accent-light), rgba(255, 215, 0, 0.12));
		border: 1px solid rgba(255, 215, 0, 0.15);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.pbc-meta-premium .pbc-meta-label {
		color: rgba(0, 0, 0, 0.65);
	}

	.pbc-meta-premium .pbc-meta-value {
		color: #000;
	}

	.pbc-meta-block {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.pbc-meta-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--admin-text-tertiary);
		font-weight: 700;
	}

	.pbc-meta-value {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--admin-text-primary);
	}

	/* --- SPECIAL REQUESTS (Notes) --- */
	.pbc-special-request {
		background: var(--admin-orange-light);
		border-left: 3px solid var(--admin-orange);
		padding: 10px 12px;
		border-radius: 0 8px 8px 0;
		margin-bottom: 4px;
	}

	.pbc-request-header {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--admin-orange);
		font-size: 0.75rem;
		font-weight: 800;
		margin-bottom: 4px;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.pbc-special-request p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--admin-text-secondary);
		line-height: 1.4;
	}

	.admin-select-checkbox {
		background: none;
		border: none;
		padding: 0;
		margin-right: 8px;
		margin-top: 2px;
		color: var(--admin-text-tertiary);
		cursor: pointer;
		transition: color 0.2s;
	}
	.admin-select-checkbox.checked {
		color: var(--admin-accent);
	}
</style>
