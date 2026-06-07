<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		adminNotifications,
		adminUnreadCount,
		type AdminNotification,
		type AdminNotificationType
	} from '$lib/stores/adminNotificationsList';

	let activeFilter = $state<'all' | AdminNotificationType>('all');

	const filters: { key: string; label: string; icon: string }[] = [
		{ key: 'all', label: 'All', icon: '🔔' },
		{ key: 'new_booking', label: 'Bookings', icon: '📅' },
		{ key: 'completed', label: 'Completed', icon: '✅' },
		{ key: 'cancelled', label: 'Cancelled', icon: '❌' },
		{ key: 'payment_received', label: 'Payments', icon: '💰' },
		{ key: 'new_user', label: 'Users', icon: '👤' }
	];

	let filteredNotifications = $derived(() => {
		let list = $adminNotifications;
		if (activeFilter !== 'all') {
			list = list.filter((n) => n.type === activeFilter);
		}
		return list;
	});

	function formatTimeAgo(timestamp: number): string {
		const now = Date.now();
		const diff = now - timestamp;
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (seconds < 60) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function getNotificationIcon(type: AdminNotificationType): string {
		switch (type) {
			case 'new_booking': return '📅';
			case 'walk_in_order': return '🚶';
			case 'status_change': return '🔄';
			case 'completed': return '✅';
			case 'cancelled': return '❌';
			case 'new_user': return '👤';
			case 'payment_received': return '💰';
			default: return '🔔';
		}
	}

	function getNotificationColor(type: AdminNotificationType): string {
		switch (type) {
			case 'new_booking': return '#6366f1';
			case 'walk_in_order': return '#f59e0b';
			case 'status_change': return '#3b82f6';
			case 'completed': return '#22c55e';
			case 'cancelled': return '#ef4444';
			case 'new_user': return '#8b5cf6';
			case 'payment_received': return '#10b981';
			default: return '#6b7280';
		}
	}

	function handleNotificationClick(notification: AdminNotification) {
		adminNotifications.markAsRead(notification.id);
		if (notification.bookingId) {
			goto(`/admin/bookings?bookingId=${notification.bookingId}`);
		} else if (notification.userId && notification.type === 'new_user') {
			goto(`/admin/users?id=${notification.userId}`);
		}
	}

	function markAllRead() {
		adminNotifications.markAllAsRead();
	}

	function clearAll() {
		if (confirm('Clear all notifications?')) {
			adminNotifications.clear();
		}
	}

	function deleteNotification(id: string, e: Event) {
		e.stopPropagation();
		adminNotifications.delete(id);
	}
</script>

<div class="notifications-page">
	<!-- Filter & Actions Bar -->
	<div class="notifications-header">
		<div class="filter-action-row">
			<div class="filter-pills">
				{#each filters as f}
					<button
						class="filter-pill"
						class:active={activeFilter === f.key}
						onclick={() => (activeFilter = f.key as any)}
					>
						<span class="filter-icon">{f.icon}</span>
						{f.label}
						{#if f.key !== 'all' && $adminNotifications.filter((n) => n.type === f.key && !n.read).length > 0}
							<span class="filter-badge">
								{$adminNotifications.filter((n) => n.type === f.key && !n.read).length}
							</span>
						{/if}
					</button>
				{/each}
			</div>

			<div class="header-actions">
				{#if $adminUnreadCount > 0}
					<button class="action-btn" onclick={markAllRead} title="Mark all as read">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
					</button>
				{/if}
				{#if $adminNotifications.length > 0}
					<button class="action-btn delete" onclick={clearAll} title="Clear all">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Notifications List -->
	<div class="notifications-list">
		{#if filteredNotifications().length === 0}
			<div class="empty-state">
				<div class="empty-icon">🔔</div>
				<h3>No notifications</h3>
				<p>You're all caught up! Updates will appear here.</p>
			</div>
		{:else}
			{#each filteredNotifications() as notification (notification.id)}
				<div
					class="notification-card"
					class:unread={!notification.read}
					style="--notification-color: {getNotificationColor(notification.type)}"
					onclick={() => handleNotificationClick(notification)}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && handleNotificationClick(notification)}
				>
					<div
						class="notification-indicator"
						style="background: {getNotificationColor(notification.type)}"
					></div>

					<div
						class="nc-avatar"
						style="background: {getNotificationColor(notification.type)}20; color: {getNotificationColor(notification.type)}"
					>
						{#if notification.userName}
							{notification.userName.charAt(0).toUpperCase()}
						{:else}
							{getNotificationIcon(notification.type)}
						{/if}
					</div>

					<div class="notification-content">
						<div class="nc-top-row">
							<h4 class="nc-title">{notification.title}</h4>
							<span class="nc-time">{formatTimeAgo(notification.createdAt)}</span>
						</div>

						<p class="nc-summary">{notification.message}</p>

						<!-- Structured Badges -->
						<div class="nc-badges">
							{#if notification.userName}
								<span class="nc-badge user-badge">
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
									{notification.userName}
								</span>
							{/if}
							{#if notification.data?.amount}
								<span class="nc-badge amount-badge">
									₹{notification.data.amount}
								</span>
							{/if}
							{#if notification.data?.status}
								<span class="nc-badge status-badge" data-status={notification.data.status}>
									{notification.data.status}
								</span>
							{/if}
						</div>
					</div>

					<button
						class="delete-btn"
						onclick={(e) => deleteNotification(notification.id, e)}
						title="Delete notification"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
					</button>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.notifications-page {
		display: flex;
		flex-direction: column;
		gap: 16px;
		min-height: 100%;
		padding: 16px;
		max-width: 800px;
		margin: 0 auto;
	}

	/* ━━━ Header ━━━ */
	.notifications-header {
		position: sticky;
		top: 0;
		background: var(--admin-bg, #ffffff);
		padding: 8px 0 12px;
		z-index: 10;
		border-bottom: 1px solid var(--admin-border, #e5e7eb);
		margin: -16px -16px 0 -16px;
		padding-left: 16px;
		padding-right: 16px;
	}

	.filter-action-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	/* ━━━ Filter Pills ━━━ */
	.filter-pills {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		flex: 1;
		padding-bottom: 4px;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.filter-pills::-webkit-scrollbar {
		display: none;
	}

	.filter-pill {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 7px 14px;
		background: var(--admin-bg-secondary, #f3f4f6);
		border: 1px solid var(--admin-border, #e5e7eb);
		border-radius: 100px;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--admin-text-secondary, #6b7280);
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
		flex-shrink: 0;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
	}

	.filter-pill:hover {
		border-color: var(--admin-accent, #6366f1);
		color: var(--admin-accent, #6366f1);
	}

	.filter-pill.active {
		background: var(--admin-accent, #6366f1);
		border-color: var(--admin-accent, #6366f1);
		color: white;
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
	}

	.filter-icon {
		font-size: 0.9rem;
	}

	.filter-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		background: white;
		color: var(--admin-accent, #6366f1);
		border-radius: 100px;
		font-size: 0.65rem;
		font-weight: 800;
	}

	.filter-pill.active .filter-badge {
		background: rgba(255, 255, 255, 0.25);
		color: white;
	}

	/* ━━━ Header Actions ━━━ */
	.header-actions {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		border: 1px solid var(--admin-border, #e5e7eb);
		background: var(--admin-bg-secondary, #f9fafb);
		color: var(--admin-text-secondary, #6b7280);
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.action-btn:hover {
		background: var(--admin-accent-light, #eef2ff);
		color: var(--admin-accent, #6366f1);
		border-color: var(--admin-accent, #6366f1);
		transform: translateY(-1px);
	}

	.action-btn.delete:hover {
		background: #fee2e2;
		color: #ef4444;
		border-color: #ef4444;
	}

	.action-btn:active {
		transform: scale(0.92);
	}

	/* ━━━ Notification List ━━━ */
	.notifications-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding-bottom: 24px;
	}

	/* ━━━ Notification Card ━━━ */
	.notification-card {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 14px;
		background: white;
		border-radius: 16px;
		border: 1px solid var(--admin-border, #e5e7eb);
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
	}

	.notification-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
		border-color: var(--admin-border-strong, #d1d5db);
	}

	.notification-card:active {
		transform: scale(0.98);
	}

	.notification-card.unread {
		border-color: var(--notification-color, var(--admin-accent, #6366f1));
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
	}

	.notification-card.unread::after {
		content: '';
		position: absolute;
		top: 14px;
		right: 14px;
		width: 8px;
		height: 8px;
		background: #ef4444;
		border-radius: 50%;
		box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
	}

	/* ━━━ Indicator ━━━ */
	.notification-indicator {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
	}

	/* ━━━ Avatar ━━━ */
	.nc-avatar {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		font-size: 1.1rem;
		margin-left: 6px;
	}

	/* ━━━ Content ━━━ */
	.notification-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-right: 12px;
	}

	.nc-top-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		margin-bottom: 2px;
	}

	.nc-title {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--admin-text, #111827);
		flex: 1;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nc-time {
		font-size: 0.7rem;
		color: var(--admin-text-secondary, #9ca3af);
		font-weight: 600;
		flex-shrink: 0;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.nc-summary {
		margin: 0 0 6px 0;
		font-size: 0.82rem;
		color: var(--admin-text-secondary, #6b7280);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* ━━━ Badges ━━━ */
	.nc-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 2px;
	}

	.nc-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: 6px;
		background: var(--admin-bg-secondary, #f3f4f6);
		color: var(--admin-text-secondary, #6b7280);
	}

	.nc-badge.user-badge {
		background: rgba(124, 58, 237, 0.08);
		color: #7c3aed;
	}

	.nc-badge.amount-badge {
		background: #dcfce7;
		color: #166534;
		font-weight: 700;
	}

	.nc-badge.status-badge {
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.65rem;
		font-weight: 700;
	}

	.nc-badge.status-badge[data-status='pending'] {
		background: #fef3c7;
		color: #92400e;
	}
	.nc-badge.status-badge[data-status='confirmed'] {
		background: #dbeafe;
		color: #1e40af;
	}
	.nc-badge.status-badge[data-status='completed'] {
		background: #dcfce7;
		color: #166534;
	}
	.nc-badge.status-badge[data-status='cancelled'] {
		background: #fee2e2;
		color: #991b1b;
	}
	.nc-badge.status-badge[data-status='in-progress'] {
		background: #ede9fe;
		color: #5b21b6;
	}

	/* ━━━ Delete Button ━━━ */
	.delete-btn {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 28px;
		height: 28px;
		border-radius: 8px;
		border: none;
		background: var(--admin-bg-secondary, #f9fafb);
		color: var(--admin-text-tertiary, #9ca3af);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transform: scale(0.9);
		transition: all 0.2s ease;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
	}

	/* Mobile: always visible */
	@media (max-width: 768px) {
		.delete-btn {
			opacity: 1;
			transform: scale(1);
			background: var(--admin-bg-secondary, #f3f4f6);
			top: auto;
			bottom: 12px;
		}
	}

	.notification-card:hover .delete-btn {
		opacity: 1;
		transform: scale(1);
	}

	.delete-btn:hover {
		background: #fee2e2;
		color: #ef4444;
	}

	/* ━━━ Empty State ━━━ */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 20px;
		text-align: center;
	}

	.empty-icon {
		font-size: 3.5rem;
		margin-bottom: 16px;
		opacity: 0.3;
		filter: grayscale(1);
	}

	.empty-state h3 {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--admin-text, #111827);
		margin: 0 0 6px;
	}

	.empty-state p {
		font-size: 0.9rem;
		color: var(--admin-text-secondary, #6b7280);
		margin: 0;
		max-width: 240px;
	}
</style>
