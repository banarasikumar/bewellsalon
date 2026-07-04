<script lang="ts">
	import CircularProgress from '$lib/components/staff/CircularProgress.svelte';
	import StatusBadge from '$lib/components/staff/StatusBadge.svelte';
	import { getElapsedSeconds } from '$lib/stores/serviceTimer';

	let {
		booking,
		now,
		onOpen = () => {},
		onResume = () => {},
		onPause = () => {},
		onComplete = () => {},
		onClientClick = () => {}
	} = $props();

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

	function getPaymentLabel(b: any): string {
		const p = b.payment;
		if (!p) return '';
		if (p.type === 'full') return 'Prepaid';
		if (p.type === 'token') return 'Token';
		if (p.type === 'free' || p.method === 'pay_at_salon') return 'Pay at Salon';
		return '';
	}

	function getPaymentMethodIcon(b: any): string {
		const p = b.payment;
		if (!p) return '';
		if (p.type === 'full') return '💳';
		if (p.type === 'token') return '🪙';
		return '🏪';
	}
</script>

<div
	class="booking-card {booking.status === 'in-progress' ? 'active-service-mode' : 'card-' + booking.status}"
	onclick={(e) => {
		onOpen(booking);
	}}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && onOpen(booking)}
>
	{#if booking.status === 'in-progress'}
		{@const elapsed = getElapsedSeconds(booking, now)}
		{@const totalMins = booking.servicesList?.reduce((a: number, s: any) => a + (s.duration || 30), 0) || 30}
		{@const totalSeconds = totalMins * 60}
		{@const progress = totalSeconds > 0 ? Math.min(100, (elapsed / totalSeconds) * 100) : 0}
		{@const isOvertime = elapsed > totalSeconds}
		{@const remaining = Math.max(0, totalSeconds - elapsed)}
		{@const formattedElapsed = (() => {
			const h = Math.floor(elapsed / 3600);
			const m = Math.floor((elapsed % 3600) / 60);
			const s = elapsed % 60;
			return h > 0
				? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
				: `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
		})()}
		{@const formattedRemaining = (() => {
			const h = Math.floor(remaining / 3600);
			const m = Math.floor((remaining % 3600) / 60);
			const s = remaining % 60;
			return h > 0
				? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
				: `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
		})()}

		<div class="active-service-content">
			<div class="service-timer-header">
				<div class="timer-info">
					<span class="timer-label {booking.isTimerRunning ? 'running' : 'paused'}">
						{#if booking.isTimerRunning}
							<span class="dot"></span> In Service
						{:else}
							<span class="dot paused-dot"></span> Paused
						{/if}
					</span>
					<h3 class="timer-client">{booking.userName || 'Guest'}</h3>
					<p class="timer-phone">
						{#if booking.userPhone}
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
							{maskPhone(booking.userPhone)}
						{:else}
							<span class="no-phone">No phone</span>
						{/if}
					</p>
					<p class="timer-service">
						{#if booking.servicesList?.length}
							{booking.servicesList.map((s: any) => s.name).join(', ')}
						{:else}
							{booking.serviceName || 'Service'}
						{/if}
					</p>
				</div>
				<CircularProgress
					{progress}
					size={64}
					strokeWidth={4}
					color={isOvertime ? 'var(--s-error)' : 'var(--s-accent)'}
				>
					<span class="timer-value" class:overtime={isOvertime}>
						{isOvertime ? '+' : ''}{formattedElapsed}
					</span>
				</CircularProgress>
			</div>
			
			<div class="timer-remaining">
				{#if isOvertime}
					<span class="overtime-text">⚠️ Overtime (Est: {formatDuration(totalMins)})</span>
				{:else}
					<span class="remaining-text">{formattedRemaining} remaining</span>
				{/if}
			</div>

			{#if booking.payment}
				<div class="card-payment-bar">
					<span class="payment-badge {booking.payment.type}">
						{getPaymentMethodIcon(booking)} {getPaymentLabel(booking)}
					</span>
					<span class="payment-price">₹{booking.totalAmount || booking.price || '-'}</span>
				</div>
			{/if}

			{#if booking.notes}
				<div class="special-request">
					<div class="request-header">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
						<span>Special Request</span>
					</div>
					<p>{booking.notes}</p>
				</div>
			{/if}

			<div class="timer-actions">
				{#if !booking.isTimerRunning}
					<button
						class="timer-btn-outline"
						onclick={(e) => {
							e.stopPropagation();
							onResume(booking);
						}}
					>
						▶ Resume
					</button>
				{:else}
					<button
						class="timer-btn-outline"
						onclick={(e) => {
							e.stopPropagation();
							onPause(booking);
						}}
					>
						⏸ Pause
					</button>
				{/if}
				<button
					class="timer-btn-complete premium-btn"
					onclick={(e) => {
						e.stopPropagation();
						onComplete(booking);
					}}
				>
					✓ Complete Service
				</button>
			</div>
		</div>
	{:else}
		<div class="bc-body">
			<div class="bc-top">
				<button
					class="bc-avatar"
					onclick={(e) => {
						e.stopPropagation();
						onClientClick(booking);
					}}
				>
					{booking.userName?.[0]?.toUpperCase() || 'G'}
				</button>
				<div class="bc-info">
					<div class="bc-name-row">
						<h4 class="bc-name">{booking.userName || 'Guest'}</h4>
						<StatusBadge status={booking.status} size="sm" animated={booking.status === 'in-progress'} />
					</div>
					
					<p class="bc-services">
						{#if booking.servicesList?.length}
							{booking.servicesList.map((s: any) => s.name).join(', ')}
						{:else}
							{booking.serviceName || 'Service'}
						{/if}
					</p>

					<p class="bc-phone">
						{#if booking.userPhone}
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
							{maskPhone(booking.userPhone)}
						{:else}
							<span class="no-phone">No phone</span>
						{/if}
					</p>
				</div>
			</div>

			{#if booking.staffName && booking.staffId && booking.staffId !== 'unassigned'}
				<div class="bc-staff-assigned">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
					<span>{booking.staffName}</span>
				</div>
			{:else}
				<div class="bc-staff-unassigned">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
					<span>Unassigned</span>
				</div>
			{/if}

			<div class="bc-meta-grid">
				<div class="meta-block">
					<span class="meta-label">Date</span>
					<span class="meta-value">{formatDate(booking.date)}</span>
				</div>
				<div class="meta-block">
					<span class="meta-label">Time</span>
					<span class="meta-value">{formatTime12h(booking.time)}</span>
				</div>
				{#if booking.servicesList?.some((s: any) => s.duration)}
					<div class="meta-block">
						<span class="meta-label">Duration</span>
						<span class="meta-value">{formatDuration(booking.servicesList.reduce((a: number, s: any) => a + (s.duration || 0), 0))}</span>
					</div>
				{/if}
			</div>

			{#if booking.payment}
				<div class="card-payment-bar">
					<span class="payment-badge {booking.payment.type}">
						{getPaymentMethodIcon(booking)} {getPaymentLabel(booking)}
					</span>
					<span class="payment-price">₹{booking.totalAmount || booking.price || '-'}</span>
				</div>
			{/if}

			{#if booking.notes}
				<div class="special-request">
					<div class="request-header">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
						<span>Special Request</span>
					</div>
					<p>{booking.notes}</p>
				</div>
			{/if}

			{#if booking.status === 'pending' || booking.status === 'confirmed'}
				<div class="bc-actions">
					{#if booking.status === 'pending'}
						<button class="action-btn action-confirm">Confirm</button>
						<button class="action-btn action-decline">Decline</button>
					{:else if booking.status === 'confirmed'}
						<button class="action-btn action-primary premium-btn">
							{!booking.staffId || booking.staffId === 'unassigned' ? 'Claim & Start' : 'Start Service'}
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Premium Card Reset */
	.booking-card {
		position: relative;
		background: var(--s-surface);
		border-radius: 20px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		box-shadow: var(--s-shadow-md);
		border: 1px solid var(--s-border-strong);
		transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
		cursor: pointer;
		overflow: hidden;
		animation: s-fadeInUp 0.4s var(--s-ease-spring) backwards;
		margin-bottom: 16px;
	}

	.booking-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--s-shadow-lg);
	}

	.booking-card:active {
		transform: translateY(0) scale(0.97);
	}

	:global(.staff-app.dark) .booking-card {
		background: var(--s-surface);
		box-shadow: var(--s-shadow-md);
		border-color: rgba(255, 255, 255, 0.08);
	}

	/* Active Service Mode Accent */
	.active-service-mode {
		border: 1px solid var(--s-accent-light);
		box-shadow: var(--s-shadow-glow);
	}
	.active-service-mode::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		background: var(--s-grad-accent);
	}
	:global(.staff-app.dark) .active-service-mode {
		border-color: var(--s-accent-dark);
		box-shadow: 0 4px 20px rgba(232, 167, 48, 0.1);
	}

	/* --- TOP INFO SECTION --- */
	.bc-top {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.bc-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--s-bg-primary);
		color: var(--s-text-primary);
		font-weight: 800;
		font-size: 1.3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border: 1px solid var(--s-border);
		cursor: pointer;
		transition: transform 0.2s ease, background 0.2s ease;
	}

	.bc-avatar:hover {
		transform: scale(1.05);
		background: var(--s-accent-bg);
		color: var(--s-accent);
	}

	.bc-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.bc-name-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}

	.bc-name {
		font-family: var(--s-font-display);
		font-size: 1.2rem;
		font-weight: 800;
		color: var(--s-text-primary);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		letter-spacing: -0.01em;
	}

	.bc-services {
		font-size: 0.95rem;
		color: var(--s-text-secondary);
		margin: 4px 0 0 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-weight: 600;
	}

	.bc-phone {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.8rem;
		color: var(--s-text-tertiary);
		margin: 2px 0 0 0;
	}

	.phone-icon {
		color: var(--s-text-tertiary);
	}

	/* --- STAFF ASSIGNMENT --- */
	.bc-staff-assigned, .bc-staff-unassigned {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 4px 10px;
		border-radius: 100px;
		width: fit-content;
	}

	.bc-staff-assigned {
		background: var(--s-bg-tertiary);
		color: var(--s-text-secondary);
	}

	.bc-staff-unassigned {
		background: var(--s-warning-bg);
		color: var(--s-warning);
		border: 1px dashed var(--s-warning);
	}

	/* --- META GRID (Date/Time) --- */
	.bc-meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
		gap: 12px;
		background: var(--s-bg-primary);
		padding: 12px 16px;
		border-radius: 12px;
		margin-top: 4px;
		border: 1px solid var(--s-border);
	}

	.meta-block {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.meta-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--s-text-tertiary);
		font-weight: 600;
	}

	.meta-value {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--s-text-primary);
	}

	/* --- SPECIAL REQUESTS (Notes) --- */
	.special-request {
		background: rgba(232, 167, 48, 0.05);
		border-left: 3px solid var(--s-accent);
		padding: 10px 12px;
		border-radius: 0 8px 8px 0;
		margin-top: 4px;
	}

	:global(.staff-app.dark) .special-request {
		background: rgba(232, 167, 48, 0.1);
	}

	.request-header {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--s-accent);
		font-size: 0.75rem;
		font-weight: 700;
		margin-bottom: 4px;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.special-request p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--s-text-secondary);
		line-height: 1.4;
	}

	/* --- PAYMENT BAR --- */
	.card-payment-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		border-radius: 12px;
		background: var(--s-bg-primary);
		border: 1px solid var(--s-border);
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

	.payment-badge.full { background: var(--s-success-bg); color: var(--s-success); }
	.payment-badge.token { background: var(--s-warning-bg); color: var(--s-warning); }
	.payment-badge.free { background: var(--s-bg-secondary); color: var(--s-text-secondary); }

	.payment-price {
		font-weight: 700;
		font-size: 0.95rem;
		color: var(--s-text-primary);
	}

	/* --- ACTIONS --- */
	.bc-actions {
		display: flex;
		gap: 8px;
		margin-top: 4px;
	}

	.action-btn {
		flex: 1;
		padding: 10px;
		border-radius: 10px;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
		text-align: center;
	}

	.action-confirm {
		background: var(--s-success-bg);
		color: var(--s-success);
	}
	.action-confirm:hover { background: var(--s-success); color: white; }

	.action-decline {
		background: var(--s-error-bg);
		color: var(--s-error);
	}
	.action-decline:hover { background: var(--s-error); color: white; }

	.premium-btn {
		background: var(--s-grad-accent);
		color: white;
		box-shadow: 0 4px 14px rgba(232, 167, 48, 0.35);
		position: relative;
		overflow: hidden;
	}

	.premium-btn::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		animation: s-shimmer 2.5s ease-in-out infinite;
	}

	.premium-btn:active {
		transform: scale(0.98);
	}

	/* --- ACTIVE SERVICE TIMER STYLES --- */
	.active-service-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.service-timer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
	}

	.timer-info {
		flex: 1;
		min-width: 0;
	}

	.timer-label {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 4px 10px;
		border-radius: 100px;
		margin-bottom: 6px;
	}

	.timer-label.running {
		background: rgba(232, 167, 48, 0.1);
		color: var(--s-accent);
	}

	.timer-label.paused {
		background: var(--s-bg-tertiary);
		color: var(--s-text-secondary);
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--s-accent);
		animation: s-pulse 1.5s infinite;
	}
	.paused-dot {
		background: var(--s-text-tertiary);
		animation: none;
	}

	.timer-client {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--s-text-primary);
		margin: 0 0 2px 0;
	}

	.timer-service {
		font-size: 0.9rem;
		color: var(--s-text-secondary);
		margin: 0;
	}

	.timer-phone {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.8rem;
		color: var(--s-text-tertiary);
		margin: 0 0 4px 0;
	}

	.timer-value {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--s-text-primary);
	}

	.timer-value.overtime {
		color: var(--s-error);
	}

	.timer-remaining {
		text-align: right;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.remaining-text { color: var(--s-text-secondary); }
	.overtime-text { color: var(--s-error); }

	.timer-actions {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}

	.timer-btn-outline {
		flex: 1;
		padding: 10px;
		border-radius: 10px;
		border: 1px solid var(--s-border);
		background: var(--s-surface);
		color: var(--s-text-primary);
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.timer-btn-outline:hover {
		background: var(--s-bg-tertiary);
	}
	:global(.staff-app.dark) .timer-btn-outline {
		background: var(--s-bg-secondary);
	}

	.timer-btn-complete {
		flex: 1.5;
		padding: 10px;
		border-radius: 10px;
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
		border: none;
	}
</style>
