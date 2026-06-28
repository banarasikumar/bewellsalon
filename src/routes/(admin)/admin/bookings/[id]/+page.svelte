<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		allBookings,
		adminStaffUsers,
		updateBookingStatus,
		updateBookingDetails,
		formatFirestoreDate,
		formatRelativeTime,
		calculateCountdown,
		getBookingTimestamp,
		type Booking
	} from '$lib/stores/adminData';
	import { showToast } from '$lib/stores/toast';
	import {
		Calendar,
		User,
		Phone,
		Mail,
		Check,
		Ban,
		Clock,
		MessageCircle,
		Scissors,
		IndianRupee,
		Star,
		ChevronRight,
		UserCheck,
		AlignLeft
	} from 'lucide-svelte';

	let bookingId = $derived($page.params.id);
	let booking = $derived($allBookings.find((b) => b.id === bookingId) as Booking | undefined);
	let isProcessing = $state(false);

	function getDisplayStatus(b: Booking): { label: string; cssClass: string } {
		const s = (b.status || 'pending').toLowerCase();
		if (s === 'confirmed') {
			const ts = getBookingTimestamp(b);
			if (ts > 0 && ts < Date.now()) return { label: 'OVERDUE', cssClass: 'overdue' };
			return { label: 'CONFIRMED', cssClass: 'confirmed' };
		}
		if (s === 'declined') return { label: 'CANCELLED', cssClass: 'cancelled' };
		return { label: s.toUpperCase(), cssClass: s };
	}

	async function handleStatusUpdate(newStatus: string) {
		if (!booking) return;
		isProcessing = true;
		try {
			await updateBookingStatus(booking.id, newStatus);
			const msgs: Record<string, string> = {
				completed: 'Marked as Completed',
				confirmed: 'Booking Confirmed',
				cancelled: 'Booking Cancelled'
			};
			showToast(msgs[newStatus] || 'Status Updated', 'success');
		} catch (e: any) {
			showToast('Error: ' + e.message, 'error');
		} finally {
			isProcessing = false;
		}
	}

	async function handleStaffChange(e: Event) {
		if (!booking) return;
		const select = e.currentTarget as HTMLSelectElement;
		const staffId = select.value;
		const staffName = select.options[select.selectedIndex].text;
		try {
			await updateBookingDetails(booking.id, { staffId, staffName });
			showToast('Staff assignment updated', 'success');
		} catch (error) {
			showToast('Failed to update assignment', 'error');
			select.value = booking.staffId || 'unassigned';
		}
	}

	function getServicesList(b: Booking): any[] {
		if (b.servicesList && Array.isArray(b.servicesList)) return b.servicesList;
		if (b.service) return b.service.split(',').map((s: string) => ({ name: s.trim() }));
		if (b.serviceName) return [{ name: b.serviceName }];
		return [];
	}

	function requestGoogleReview(phone: string) {
		let num = phone.replace(/[^0-9]/g, '');
		if (num.startsWith('0')) num = '91' + num.slice(1);
		if (!num.startsWith('91')) num = '91' + num;

		const reviewLink = 'https://g.page/r/CQnQ2Bh7v4sYEBM/review';
		const msg = encodeURIComponent(
			`Hi! Thank you for visiting Bewell Family Salon 💇‍♀️✨\n\nWe hope you had a wonderful experience! It would mean a lot to us if you could leave a quick Google review:\n\n${reviewLink}\n\nYour feedback helps us serve you better! 🙏`
		);
		window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
	}
</script>

{#if !booking}
	<div class="bd-empty">
		<Calendar size={40} class="bd-empty-icon" />
		<p>Booking not found</p>
		<button onclick={() => goto('/admin/bookings')}>Back to Bookings</button>
	</div>
{:else}
	{@const ds = getDisplayStatus(booking)}
	{@const services = getServicesList(booking)}
	{@const dateStr = formatFirestoreDate(booking.date)}
	{@const countdown = calculateCountdown(booking.date, booking.time)}
	{@const bookedOn = formatRelativeTime(booking.createdAt)}
	{@const rawStatus = (booking.status || 'pending').toLowerCase()}
	{@const hasPhone = !!booking.userPhone}

	<div class="bd">
		<div class="bd-bg-glow {ds.cssClass}"></div>

		<!-- Hero Profile -->
		<div class="bd-hero">
			<div class="bd-hero-content">
				{#if booking.userPhoto}
					<img src={booking.userPhoto} alt="" class="bd-hero-avatar" />
				{:else}
					<div class="bd-hero-avatar-fb {ds.cssClass}">
						{(booking.userName || 'G').charAt(0).toUpperCase()}
					</div>
				{/if}
				
				<h2 class="bd-hero-name">{booking.userName || 'Guest'}</h2>
				
				<div class="bd-hero-badges">
					<span class="bd-badge {ds.cssClass}">{ds.label}</span>
					<span class="bd-badge ghost">#{booking.id.slice(0, 8).toUpperCase()}</span>
				</div>
			</div>
		</div>

		<!-- Action Pills -->
		{#if hasPhone || booking.userEmail}
			<div class="bd-pills">
				{#if hasPhone}
					<a href="tel:{booking.userPhone}" class="bd-pill primary">
						<Phone size={14} /> Call
					</a>
					<a href="https://wa.me/{booking.userPhone?.replace(/[^0-9]/g, '').replace(/^0/, '91')}" target="_blank" class="bd-pill whatsapp">
						<MessageCircle size={14} /> WhatsApp
					</a>
				{/if}
				{#if booking.userEmail}
					<a href="mailto:{booking.userEmail}" class="bd-pill secondary">
						<Mail size={14} /> Email
					</a>
				{/if}
			</div>
		{/if}

		<!-- Seamless Content List -->
		<div class="bd-list">
			
			<!-- Appointment -->
			<div class="bd-row">
				<div class="bd-row-icon"><Calendar size={18} /></div>
				<div class="bd-row-content">
					<div class="bd-row-label">Appointment Time</div>
					<div class="bd-appt-val">
						<span class="bd-appt-date">{dateStr}</span>
						<span class="bd-appt-time">{booking.time || '--:--'}</span>
					</div>
					{#if countdown && ds.cssClass !== 'overdue'}
						<div class="bd-countdown">
							<Clock size={12} /> {countdown.label}
						</div>
					{/if}
				</div>
			</div>

			<!-- Services -->
			<div class="bd-row">
				<div class="bd-row-icon"><Scissors size={18} /></div>
				<div class="bd-row-content">
					<div class="bd-row-label">Services</div>
					{#if services.length > 0}
						<div class="bd-svc-list">
							{#each services as svc}
								<div class="bd-svc-item">
									<span>{svc.name || svc.serviceName || svc}</span>
									{#if svc.price}
										<span class="bd-svc-price"><IndianRupee size={12} />{svc.price}</span>
									{/if}
								</div>
							{/each}
						</div>
						<div class="bd-svc-total">
							<span>Total Amount</span>
							<span class="bd-total-val"><IndianRupee size={14} />{booking.totalAmount || booking.price || '--'}</span>
						</div>
					{:else}
						<p class="bd-empty-text">No services listed</p>
					{/if}
				</div>
			</div>

			<!-- Staff -->
			<div class="bd-row align-center">
				<div class="bd-row-icon"><UserCheck size={18} /></div>
				<div class="bd-row-content">
					<div class="bd-row-label">Staff Assignment</div>
					<select
						class="bd-select"
						value={booking.staffId || 'unassigned'}
						onchange={handleStaffChange}
						disabled={isProcessing}
					>
						<option value="unassigned">Unassigned (Any Staff)</option>
						{#each $adminStaffUsers as staff}
							<option value={staff.id}>{staff.displayName || staff.name || 'Staff'}</option>
						{/each}
					</select>
				</div>
			</div>
			
			<!-- Special Request -->
			{#if booking.notes}
				<div class="bd-row">
					<div class="bd-row-icon"><AlignLeft size={18} /></div>
					<div class="bd-row-content">
						<div class="bd-row-label">Special Request</div>
						<p class="bd-notes">{booking.notes}</p>
					</div>
				</div>
			{/if}

		</div>

		<div class="bd-booked-on">
			Booked {bookedOn}
		</div>

		<!-- Review CTA -->
		{#if hasPhone && rawStatus === 'completed'}
			<div class="bd-cta-wrapper">
				<button class="bd-review-cta" onclick={() => requestGoogleReview(booking.userPhone)}>
					<div class="bd-review-icon">
						<Star size={20} color="#fff" />
					</div>
					<div class="bd-review-text">
						<span class="bd-review-title">Request Google Review</span>
						<span class="bd-review-sub">Send automated WhatsApp link</span>
					</div>
					<ChevronRight size={20} class="bd-review-arrow" />
				</button>
			</div>
		{/if}

		<!-- Bottom Action Bar -->
		{#if rawStatus === 'pending' || rawStatus === 'confirmed'}
			<div class="bd-actions">
				{#if rawStatus === 'pending'}
					<button class="bd-btn danger-light" onclick={() => handleStatusUpdate('cancelled')} disabled={isProcessing}>
						<Ban size={18} /> Cancel
					</button>
					<button class="bd-btn success" onclick={() => handleStatusUpdate('confirmed')} disabled={isProcessing}>
						<Check size={18} /> Confirm
					</button>
				{:else}
					<button class="bd-btn danger-light" onclick={() => handleStatusUpdate('cancelled')} disabled={isProcessing}>
						<Ban size={18} /> Cancel
					</button>
					<button class="bd-btn primary" onclick={() => handleStatusUpdate('completed')} disabled={isProcessing}>
						<Check size={18} /> Complete
					</button>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	/* ═══════════════════════════════════════
	   BOOKING DETAILS — IMMERSIVE SEAMLESS UI
	   ═══════════════════════════════════════ */

	.bd {
		position: relative;
		padding: 0 0 100px;
		color: var(--admin-text-primary);
		max-width: 600px;
		margin: 0 auto;
		background: var(--admin-surface); /* Seamless single sheet */
		min-height: calc(100vh - 60px);
		border-radius: var(--admin-radius-lg);
		box-shadow: var(--admin-shadow-sm);
		overflow: hidden;
	}

	/* Subtle top glow based on status */
	.bd-bg-glow {
		position: absolute;
		top: 0; left: 0; right: 0; height: 160px;
		opacity: 0.12;
		pointer-events: none;
		mask-image: linear-gradient(to bottom, black, transparent);
		-webkit-mask-image: linear-gradient(to bottom, black, transparent);
	}
	.bd-bg-glow.pending { background: var(--admin-orange); }
	.bd-bg-glow.confirmed { background: var(--admin-green); }
	.bd-bg-glow.completed { background: var(--admin-accent); }
	.bd-bg-glow.cancelled { background: var(--admin-red); }
	.bd-bg-glow.overdue { background: var(--admin-orange); }

	/* ── Empty State ────────────────────── */
	.bd-empty {
		display: flex; flex-direction: column; align-items: center; justify-content: center;
		height: 60vh; gap: 12px; color: var(--admin-text-secondary);
	}
	.bd-empty-icon { opacity: 0.3; }
	.bd-empty button {
		padding: 10px 24px; background: var(--admin-surface); border: 1px solid var(--admin-border);
		border-radius: 10px; color: var(--admin-text-primary); font-size: 14px; cursor: pointer;
		font-weight: 500;
	}

	/* ── Hero Section ──────────────────── */
	.bd-hero {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 32px 16px 24px;
	}
	.bd-hero-content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.bd-hero-avatar {
		width: 88px; height: 88px; border-radius: 50%; object-fit: cover;
		box-shadow: var(--admin-shadow-sm);
	}
	.bd-hero-avatar-fb {
		width: 88px; height: 88px; border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
		font-size: 36px; font-weight: 700; color: #fff;
		box-shadow: var(--admin-shadow-sm);
	}
	.bd-hero-avatar-fb.pending { background: var(--admin-orange); }
	.bd-hero-avatar-fb.confirmed { background: var(--admin-green); }
	.bd-hero-avatar-fb.completed { background: var(--admin-accent); }
	.bd-hero-avatar-fb.cancelled { background: var(--admin-red); }
	.bd-hero-avatar-fb.overdue { background: var(--admin-orange); }

	.bd-hero-name {
		margin: 0; font-size: 26px; font-weight: 800;
		letter-spacing: -0.5px;
	}
	.bd-hero-badges {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.bd-badge {
		padding: 4px 12px; border-radius: 20px;
		font-size: 11px; font-weight: 700; letter-spacing: 1px;
	}
	.bd-badge.pending { background: var(--admin-orange-light); color: var(--admin-orange); }
	.bd-badge.confirmed { background: var(--admin-green-light); color: var(--admin-green); }
	.bd-badge.completed { background: var(--admin-accent-light); color: var(--admin-accent); }
	.bd-badge.cancelled { background: var(--admin-red-light); color: var(--admin-red); }
	.bd-badge.overdue {
		background: var(--admin-orange-light); color: var(--admin-orange);
		animation: badgePulse 2s ease-in-out infinite;
	}
	.bd-badge.ghost { background: var(--admin-surface-hover); color: var(--admin-text-secondary); letter-spacing: 0; }
	@keyframes badgePulse { 0%,100%{ opacity:1; } 50%{ opacity:0.65; } }

	/* ── Contact Pills ─────────────────── */
	.bd-pills {
		display: flex;
		justify-content: center;
		gap: 12px;
		margin-bottom: 24px;
		position: relative;
		z-index: 2;
	}
	.bd-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 10px 20px;
		border-radius: 100px;
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
		box-shadow: var(--admin-shadow-sm);
		transition: transform 0.15s;
	}
	.bd-pill:active { transform: scale(0.96); }
	.bd-pill.primary { background: var(--admin-bg); color: var(--admin-text-primary); border: 1px solid var(--admin-border); }
	.bd-pill.whatsapp { background: #25D366; color: #fff; border: 1px solid #25D366; }
	.bd-pill.secondary { background: var(--admin-bg); color: var(--admin-text-secondary); border: 1px solid var(--admin-border); }

	/* ── Seamless List ─────────────────── */
	.bd-list {
		display: flex;
		flex-direction: column;
	}
	.bd-row {
		display: flex;
		gap: 16px;
		padding: 20px 16px;
		border-bottom: 1px solid var(--admin-border);
	}
	.bd-row.align-center { align-items: center; }
	
	.bd-row-icon {
		width: 36px; height: 36px; flex-shrink: 0;
		display: flex; align-items: center; justify-content: center;
		background: var(--admin-bg);
		border-radius: 10px;
		color: var(--admin-text-secondary);
	}
	.bd-row-content { flex: 1; min-width: 0; }
	.bd-row-label {
		font-size: 12px; font-weight: 700; text-transform: uppercase;
		letter-spacing: 0.5px; color: var(--admin-text-tertiary);
		margin-bottom: 6px;
	}

	/* Appointment */
	.bd-appt-val {
		display: flex; align-items: baseline; gap: 8px;
	}
	.bd-appt-date { font-size: 16px; font-weight: 600; color: var(--admin-text-primary); }
	.bd-appt-time { font-size: 15px; color: var(--admin-text-secondary); font-weight: 500; }
	.bd-countdown {
		display: inline-flex; align-items: center; gap: 4px;
		margin-top: 8px; font-size: 12px; font-weight: 600;
		color: var(--admin-green);
		background: var(--admin-green-light);
		padding: 4px 10px; border-radius: 12px;
	}

	/* Services */
	.bd-svc-list {
		display: flex; flex-direction: column; gap: 8px;
	}
	.bd-svc-item {
		display: flex; justify-content: space-between; align-items: center;
		font-size: 15px; color: var(--admin-text-primary);
		font-weight: 500;
	}
	.bd-svc-price {
		display: flex; align-items: center; color: var(--admin-text-secondary);
	}
	.bd-svc-total {
		display: flex; justify-content: space-between; align-items: center;
		margin-top: 12px; padding-top: 12px;
		border-top: 1px dashed var(--admin-border);
		font-size: 15px; font-weight: 700; color: var(--admin-text-primary);
	}
	.bd-total-val {
		display: flex; align-items: center; color: var(--admin-accent); font-size: 16px;
	}
	.bd-empty-text { margin: 0; font-size: 14px; color: var(--admin-text-secondary); font-style: italic; }

	/* Staff Select */
	.bd-select {
		width: 100%;
		padding: 12px 14px;
		background: var(--admin-bg);
		border: 1px solid var(--admin-border);
		border-radius: 8px;
		color: var(--admin-text-primary);
		font-size: 15px; font-family: inherit; font-weight: 500;
		appearance: none; -webkit-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 14px center;
	}
	.bd-select:focus { outline: none; border-color: var(--admin-accent); }

	/* Notes */
	.bd-notes { margin: 0; font-size: 15px; line-height: 1.5; color: var(--admin-text-primary); }

	/* Booked On */
	.bd-booked-on {
		text-align: center;
		font-size: 13px;
		color: var(--admin-text-tertiary);
		margin: 24px 0;
	}

	/* ── Google Review CTA ─────────────── */
	.bd-cta-wrapper {
		padding: 0 16px;
	}
	.bd-review-cta {
		display: flex;
		align-items: center;
		width: 100%;
		padding: 16px;
		background: linear-gradient(135deg, var(--admin-accent), #fbbc04);
		border: none;
		border-radius: var(--admin-radius-lg);
		cursor: pointer;
		transition: transform 0.15s, box-shadow 0.15s;
		color: #fff;
		font-family: inherit;
		box-shadow: 0 4px 12px rgba(251, 188, 4, 0.3);
		text-align: left;
		margin-bottom: 24px;
	}
	.bd-review-cta:active { transform: scale(0.97); box-shadow: 0 2px 6px rgba(251, 188, 4, 0.2); }
	
	.bd-review-icon {
		width: 40px; height: 40px; border-radius: 50%;
		background: rgba(255,255,255,0.2);
		display: flex; align-items: center; justify-content: center;
		margin-right: 14px;
		flex-shrink: 0;
	}
	.bd-review-text { flex: 1; }
	.bd-review-title { display: block; font-size: 16px; font-weight: 700; margin-bottom: 2px; }
	.bd-review-sub { display: block; font-size: 13px; opacity: 0.9; }
	.bd-review-arrow { opacity: 0.7; }

	/* ── Bottom Action Bar ─────────────── */
	.bd-actions {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		gap: 12px;
		padding: 16px;
		padding-bottom: max(16px, env(safe-area-inset-bottom));
		background: var(--admin-bg);
		border-top: 1px solid var(--admin-border);
		z-index: 50;
	}
	@media (min-width: 768px) {
		.bd-actions {
			left: 250px; /* Matches sidebar */
		}
	}
	
	.bd-btn {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		padding: 16px 12px;
		border: none;
		border-radius: var(--admin-radius-md);
		font-size: 16px;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		transition: transform 0.1s;
		box-shadow: var(--admin-shadow-sm);
	}
	.bd-btn:active { transform: scale(0.97); }
	.bd-btn:disabled { opacity: 0.5; pointer-events: none; }

	.bd-btn.danger-light {
		background: var(--admin-surface-hover);
		color: var(--admin-red);
		border: 1px solid var(--admin-border);
	}
	.bd-btn.success {
		background: var(--admin-green);
		color: #fff;
	}
	.bd-btn.primary {
		background: var(--admin-accent);
		color: #fff;
	}
</style>
