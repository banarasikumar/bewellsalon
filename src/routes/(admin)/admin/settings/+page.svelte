<script lang="ts">
	import { adminUser, adminLogout } from '$lib/stores/adminAuth';
	import { goto } from '$app/navigation';
	import { showToast } from '$lib/stores/toast';
	import { UserCircle, Bell, LogOut, ChevronRight, Database, CreditCard, Settings, Volume2, Shield, Users, Gift, MonitorSmartphone, Camera, Edit3, X, Save, Loader2, Calendar } from 'lucide-svelte';
	import { migrateServices } from '$lib/migrateServices';
	import { onMount, onDestroy } from 'svelte';
	import {
		appSettings,
		initAppSettingsListener,
		destroyAppSettingsListener,
		updateAppSetting
	} from '$lib/stores/appSettings';
	import { updateProfile } from 'firebase/auth';
	import { auth, db } from '$lib/firebase';
	import { doc, getDoc, setDoc } from 'firebase/firestore';
	import { upload } from '@vercel/blob/client';

	let userName = $derived($adminUser?.displayName || 'Admin User');
	let userEmail = $derived($adminUser?.email || '');
	let userInitial = $derived((userName || 'A').charAt(0).toUpperCase());

	let isMigrating = $state(false);

	// Edit Profile Modal State
	let showEditModal = $state(false);
	let editName = $state('');
	let editEmail = $state('');
	let editPhone = $state('');
	let editPhotoURL = $state('');
	let isSavingProfile = $state(false);
	let isUploadingAvatar = $state(false);
	let fileInput: HTMLInputElement;
	let avatarError = $state(false);

	async function loadAdminProfileData() {
		if (!$adminUser) return;
		editName = $adminUser.displayName || '';
		editEmail = $adminUser.email || '';
		editPhone = $adminUser.phoneNumber || '';
		editPhotoURL = $adminUser.photoURL || '';

		try {
			const docRef = doc(db, 'users', $adminUser.uid);
			const snap = await getDoc(docRef);
			if (snap.exists()) {
				const data = snap.data();
				if (data.displayName) editName = data.displayName;
				if (data.email) editEmail = data.email;
				if (data.phone) editPhone = data.phone;
				if (data.photoURL || data.photo || data.avatar) {
					editPhotoURL = data.photoURL || data.photo || data.avatar;
				}
			}
		} catch (e) {
			console.error('Failed to load admin profile data:', e);
		}
	}

	async function openAdminEditModal() {
		await loadAdminProfileData();
		showEditModal = true;
	}

	async function handleAdminAvatarUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file || !auth.currentUser) return;

		if (file.size > 8 * 1024 * 1024) {
			showToast('File size must be less than 8MB', 'error');
			if (fileInput) fileInput.value = '';
			return;
		}

		isUploadingAvatar = true;
		try {
			const ext = file.name.split('.').pop() || 'jpg';
			const fileName = `avatars/admin_${auth.currentUser.uid}_${Date.now()}.${ext}`;
			const newBlob = await upload(fileName, file, {
				access: 'public',
				handleUploadUrl: '/api/upload'
			});
			editPhotoURL = newBlob.url;

			// Update Auth and Firestore immediately for avatar
			await updateProfile(auth.currentUser, { photoURL: editPhotoURL });
			const userRef = doc(db, 'users', auth.currentUser.uid);
			await setDoc(userRef, { photoURL: editPhotoURL, photo: editPhotoURL, avatar: editPhotoURL, image: editPhotoURL }, { merge: true });

			adminUser.update((u) => (u ? ({ ...u, photoURL: editPhotoURL } as any) : null));
			showToast('Profile picture updated successfully!', 'success');
			avatarError = false;
		} catch (err: any) {
			console.error('Failed to upload avatar:', err);
			showToast(err?.message || 'Failed to upload image', 'error');
		} finally {
			isUploadingAvatar = false;
			if (fileInput) fileInput.value = '';
		}
	}

	async function saveAdminProfile() {
		if (!auth.currentUser) return;
		isSavingProfile = true;
		try {
			if (editName !== auth.currentUser.displayName || editPhotoURL !== auth.currentUser.photoURL) {
				await updateProfile(auth.currentUser, {
					displayName: editName,
					photoURL: editPhotoURL
				});
			}

			const userRef = doc(db, 'users', auth.currentUser.uid);
			await setDoc(
				userRef,
				{
					displayName: editName,
					name: editName,
					email: editEmail,
					phone: editPhone,
					photoURL: editPhotoURL,
					photo: editPhotoURL,
					updatedAt: new Date().toISOString()
				},
				{ merge: true }
			);

			adminUser.update((u) =>
				u
					? ({ ...u, displayName: editName, email: editEmail, phoneNumber: editPhone, photoURL: editPhotoURL } as any)
					: null
			);

			showToast('Profile updated successfully!', 'success');
			showEditModal = false;
		} catch (error: any) {
			console.error('Failed to save profile:', error);
			showToast('Failed to save profile', 'error');
		} finally {
			isSavingProfile = false;
		}
	}

	async function handleLogout() {
		if (!confirm('Are you sure you want to logout?')) return;
		try {
			await adminLogout();
			showToast('Logged out successfully', 'logout');
			goto('/admin/login');
		} catch (e: any) {
			showToast('Logout failed', 'error');
		}
	}

	async function handleMigration() {
		if (!confirm('This will migrate legacy services to the database. Continue?')) return;
		isMigrating = true;
		try {
			const result = await migrateServices();
			showToast(
				`Result: ${result.added} Added, ${result.skipped} Skipped, ${result.errors} Errors`,
				result.errors > 0 ? 'error' : 'success'
			);
		} catch (e) {
			console.error(e);
			showToast('Migration failed', 'error');
		} finally {
			isMigrating = false;
		}
	}

	function comingSoon(feature: string) {
		showToast(`${feature} — coming soon!`, 'success');
	}

	// Notifications
	import {
		requestNotificationPermission,
		disableNotifications,
		notificationStatus,
		checkNotificationStatus,
		adminNotificationPrefs
	} from '$lib/stores/adminNotificationPreferences';

	onMount(async () => {
		initAppSettingsListener();
		if ($adminUser) {
			await checkNotificationStatus($adminUser.uid, 'admin');
		} else {
			checkNotificationStatus();
		}
	});

	onDestroy(() => {
		destroyAppSettingsListener();
	});

	let showDeniedModal = $state(false);

	async function toggleNotifications() {
		if ($notificationStatus === 'denied') {
			showDeniedModal = true;
			return;
		}

		if ($notificationStatus === 'granted') {
			if (!$adminUser) return;
			const success = await disableNotifications($adminUser.uid, 'admin');
			if (success) {
				showToast('Push Notifications Disabled', 'success');
			} else {
				showToast('Failed to disable notifications', 'error');
			}
			return;
		}

		if (!$adminUser) return;
		const success = await requestNotificationPermission($adminUser.uid, 'admin');
		if (success) {
			showToast('Push Notifications Enabled!', 'success');
		} else if (Notification.permission === 'denied') {
			showDeniedModal = true;
		} else {
			showToast('Failed to enable, please try again.', 'error');
		}
	}
</script>

<div class="settings-container">
	<!-- Profile Section -->
	<div class="settings-header">
		<div class="profile-card">
			<div class="profile-avatar">
				{#if $adminUser?.photoURL && !avatarError}
					<img
						src={$adminUser.photoURL}
						alt={userName}
						class="admin-profile-img"
						onerror={() => (avatarError = true)}
					/>
				{:else}
					{userInitial}
				{/if}
			</div>
			<div class="profile-info">
				<h2>{userName}</h2>
				<p>{userEmail}</p>
			</div>
			<button class="edit-btn" onclick={openAdminEditModal} aria-label="Edit Profile" title="Edit Profile">
				<Edit3 size={20} />
			</button>
		</div>
	</div>

	<div class="settings-content">
		<!-- Business Group -->
		<div class="settings-group">
			<h3 class="group-title">Business Operations</h3>
			<div class="settings-card">
				<div class="setting-item">
					<div class="setting-icon bg-indigo">
						<Database size={20} />
					</div>
					<div class="setting-details">
						<span class="setting-label">Salon Capacity</span>
						<span class="setting-desc">Max concurrent bookings</span>
					</div>
					<div class="setting-action">
						<input
							type="number"
							min="1"
							max="50"
							value={$appSettings.totalChairs || 3}
							onchange={(e) => {
								const val = parseInt(e.currentTarget.value, 10);
								if (!isNaN(val) && val > 0) {
									updateAppSetting('totalChairs', val);
									showToast('Total chairs updated', 'success');
								}
							}}
							class="number-input"
						/>
					</div>
				</div>

				<div class="setting-item">
					<div class="setting-icon bg-accent">
						<CreditCard size={20} />
					</div>
					<div class="setting-details">
						<span class="setting-label">Payment Gateway</span>
						<span class="setting-desc">Checkout method</span>
					</div>
					<div class="setting-action options-list">
						<label class="radio-label">
							<input
								type="radio"
								name="paymentGateway"
								value="default"
								checked={$appSettings.defaultPaymentGateway === 'default'}
								onchange={() => {
									updateAppSetting('defaultPaymentGateway', 'default');
									showToast('Payment Gateway set to Default', 'success');
								}}
							/>
							<span>Default (QR)</span>
						</label>
						<label class="radio-label">
							<input
								type="radio"
								name="paymentGateway"
								value="razorpay"
								checked={$appSettings.defaultPaymentGateway === 'razorpay'}
								onchange={() => {
									updateAppSetting('defaultPaymentGateway', 'razorpay');
									showToast('Payment Gateway set to Razorpay', 'success');
								}}
							/>
							<span>Razorpay</span>
						</label>
					</div>
				</div>

				<div class="setting-item">
					<div class="setting-icon bg-gold">
						<Gift size={20} />
					</div>
					<div class="setting-details">
						<span class="setting-label">Referral Rewards</span>
						<span class="setting-desc">Configure bonus amounts</span>
					</div>
					<div class="setting-action options-list stacked">
						<label class="mini-input">
							<span>Reg</span>
							<input
								type="number" min="0" value={$appSettings.referralRewardOnReg || 0}
								onchange={(e) => {
									const val = parseInt(e.currentTarget.value, 10);
									if (!isNaN(val) && val >= 0) updateAppSetting('referralRewardOnReg', val);
								}}
							/>
						</label>
						<label class="mini-input">
							<span>Book</span>
							<input
								type="number" min="0" value={$appSettings.referralRewardOnBooking || 0}
								onchange={(e) => {
									const val = parseInt(e.currentTarget.value, 10);
									if (!isNaN(val) && val >= 0) updateAppSetting('referralRewardOnBooking', val);
								}}
							/>
						</label>
						<label class="mini-input">
							<span>Sign</span>
							<input
								type="number" min="0" value={$appSettings.refereeSignUpBonus || 0}
								onchange={(e) => {
									const val = parseInt(e.currentTarget.value, 10);
									if (!isNaN(val) && val >= 0) updateAppSetting('refereeSignUpBonus', val);
								}}
							/>
						</label>
					</div>
				</div>
			</div>
		</div>

		<!-- Notifications Group -->
		<div class="settings-group">
			<h3 class="group-title">Notifications</h3>
			<div class="settings-card">
				<div
					class="setting-item clickable"
					role="button"
					tabindex="0"
					onclick={toggleNotifications}
					onkeydown={(e) => e.key === 'Enter' && toggleNotifications()}
				>
					<div class="setting-icon bg-red">
						<Bell size={20} />
					</div>
					<div class="setting-details">
						<span class="setting-label">Push Notifications</span>
						<span class="setting-desc">
							{#if $notificationStatus === 'granted'}Active{:else if $notificationStatus === 'denied'}Blocked{:else if $notificationStatus === 'unsupported'}Unsupported{:else}Disabled{/if}
						</span>
					</div>
					{#if $notificationStatus !== 'unsupported'}
						<div class="toggle-switch" class:on={$notificationStatus === 'granted'}>
							<div class="toggle-thumb"></div>
						</div>
					{/if}
				</div>

				{#if $notificationStatus === 'granted'}
					<div class="sub-settings-container">
						<h4 class="sub-group-title">Order Alerts</h4>
						<div class="sub-setting-grid">
							<div class="sub-setting-item">
								<span style="display: inline-flex; align-items: center; gap: 6px;"><Calendar size={14} /> New Bookings</span>
								<button class="sub-toggle" class:on={$adminNotificationPrefs.newBookings} onclick={() => adminNotificationPrefs.toggle('newBookings')} aria-label="Toggle">
									<div class="sub-toggle-thumb"></div>
								</button>
							</div>
							<div class="sub-setting-item">
								<span>🚶 Walk-ins</span>
								<button class="sub-toggle" class:on={$adminNotificationPrefs.walkInOrders} onclick={() => adminNotificationPrefs.toggle('walkInOrders')} aria-label="Toggle">
									<div class="sub-toggle-thumb"></div>
								</button>
							</div>
							<div class="sub-setting-item">
								<span>🔄 Status</span>
								<button class="sub-toggle" class:on={$adminNotificationPrefs.statusChanges} onclick={() => adminNotificationPrefs.toggle('statusChanges')} aria-label="Toggle">
									<div class="sub-toggle-thumb"></div>
								</button>
							</div>
							<div class="sub-setting-item">
								<span>✅ Completed</span>
								<button class="sub-toggle" class:on={$adminNotificationPrefs.completedBookings} onclick={() => adminNotificationPrefs.toggle('completedBookings')} aria-label="Toggle">
									<div class="sub-toggle-thumb"></div>
								</button>
							</div>
							<div class="sub-setting-item">
								<span>❌ Cancelled</span>
								<button class="sub-toggle" class:on={$adminNotificationPrefs.cancelledBookings} onclick={() => adminNotificationPrefs.toggle('cancelledBookings')} aria-label="Toggle">
									<div class="sub-toggle-thumb"></div>
								</button>
							</div>
							<div class="sub-setting-item">
								<span>💰 Payments</span>
								<button class="sub-toggle" class:on={$adminNotificationPrefs.paymentReceived} onclick={() => adminNotificationPrefs.toggle('paymentReceived')} aria-label="Toggle">
									<div class="sub-toggle-thumb"></div>
								</button>
							</div>
						</div>

						<h4 class="sub-group-title" style="margin-top: 16px;">User Alerts</h4>
						<div class="sub-setting-grid">
							<div class="sub-setting-item">
								<span>👤 New Signups</span>
								<button class="sub-toggle" class:on={$adminNotificationPrefs.newUsers} onclick={() => adminNotificationPrefs.toggle('newUsers')} aria-label="Toggle">
									<div class="sub-toggle-thumb"></div>
								</button>
							</div>
						</div>
					</div>
				{/if}

				<div
					class="setting-item clickable"
					role="button"
					tabindex="0"
					onclick={() => adminNotificationPrefs.toggle('soundEnabled')}
					onkeydown={(e) => e.key === 'Enter' && adminNotificationPrefs.toggle('soundEnabled')}
				>
					<div class="setting-icon bg-blue">
						<Volume2 size={20} />
					</div>
					<div class="setting-details">
						<span class="setting-label">Sound Effects</span>
						<span class="setting-desc">App notification sounds</span>
					</div>
					<div class="toggle-switch" class:on={$adminNotificationPrefs.soundEnabled}>
						<div class="toggle-thumb"></div>
					</div>
				</div>
			</div>
		</div>

		<!-- System Group -->
		<div class="settings-group">
			<h3 class="group-title">System</h3>
			<div class="settings-card">
				<div class="setting-item clickable" role="button" tabindex="0" onclick={handleMigration}>
					<div class="setting-icon bg-green">
						<Database size={20} />
					</div>
					<div class="setting-details">
						<span class="setting-label">{isMigrating ? 'Migrating...' : 'Migrate Services'}</span>
						<span class="setting-desc">Legacy DB to Firestore</span>
					</div>
					{#if !isMigrating}
						<ChevronRight size={18} color="var(--admin-text-tertiary)" />
					{/if}
				</div>
				<div class="setting-item clickable" role="button" tabindex="0" onclick={handleLogout}>
					<div class="setting-icon bg-red-dim">
						<LogOut size={20} />
					</div>
					<div class="setting-details">
						<span class="setting-label text-red">Logout</span>
						<span class="setting-desc">End your session</span>
					</div>
				</div>
			</div>
		</div>

		<div class="app-version-info">
			<MonitorSmartphone size={20} />
			<p>Admin Panel v2.0.0</p>
			<span>Powered by SvelteKit</span>
		</div>
	</div>
</div>

<!-- Permission Denied Modal -->
{#if showDeniedModal}
	<div class="modal-backdrop" onclick={() => (showDeniedModal = false)} role="presentation">
		<div class="modal-content" onclick={(e) => e.stopPropagation()} role="presentation">
			<div class="modal-header">
				<Shield size={32} color="var(--admin-red)" style="margin-bottom: 12px;"/>
				<h3>Notifications Blocked</h3>
			</div>
			<div class="modal-body">
				<p>Your browser is blocking notifications. To receive alerts, open your device settings:</p>
				<div class="path-box">Settings &gt; Apps &gt; Bewell Admin &gt; Permissions</div>
				<p>and Allow Notifications.</p>
			</div>
			<div class="modal-footer">
				<button class="primary-btn" onclick={() => (showDeniedModal = false)}>Got it</button>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Admin Profile Modal -->
{#if showEditModal}
	<div
		class="modal-backdrop"
		onclick={() => (showEditModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showEditModal = false)}
	>
		<div
			class="modal-content admin-edit-modal"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
			aria-modal="true"
		>
			<div class="modal-header-row">
				<h3>Edit Admin Profile</h3>
				<button class="icon-close-btn" onclick={() => (showEditModal = false)} aria-label="Close">
					<X size={20} />
				</button>
			</div>

			<div class="modal-body-content">
				<!-- Avatar Edit Section -->
				<div class="avatar-edit-wrapper">
					<div class="avatar-circle-box">
						{#if editPhotoURL}
							<img src={editPhotoURL} alt="Admin Avatar" class="avatar-circle-img" />
						{:else}
							<span class="avatar-initial-text">{userInitial}</span>
						{/if}
						{#if isUploadingAvatar}
							<div class="avatar-upload-loading">
								<Loader2 size={24} class="spin-icon" color="#ffffff" />
							</div>
						{/if}
					</div>
					<input
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif"
						bind:this={fileInput}
						onchange={handleAdminAvatarUpload}
						style="display: none;"
					/>
					<button
						type="button"
						class="change-photo-btn"
						onclick={() => fileInput?.click()}
						disabled={isUploadingAvatar}
					>
						<Camera size={16} />
						<span>{isUploadingAvatar ? 'Uploading...' : 'Change Profile Picture'}</span>
					</button>
				</div>

				<div class="input-field-group">
					<label for="adminDisplayName">Display Name</label>
					<input
						id="adminDisplayName"
						type="text"
						class="custom-admin-input"
						bind:value={editName}
						placeholder="Admin Name"
					/>
				</div>

				<div class="input-field-group">
					<label for="adminDisplayEmail">Email Address</label>
					<input
						id="adminDisplayEmail"
						type="email"
						class="custom-admin-input"
						bind:value={editEmail}
						placeholder="admin@example.com"
					/>
				</div>

				<div class="input-field-group">
					<label for="adminDisplayPhone">Phone Number</label>
					<input
						id="adminDisplayPhone"
						type="tel"
						class="custom-admin-input"
						bind:value={editPhone}
						placeholder="+919876543210"
					/>
				</div>
			</div>

			<div class="modal-footer-row">
				<button type="button" class="cancel-action-btn" onclick={() => (showEditModal = false)}>
					Cancel
				</button>
				<button
					type="button"
					class="save-action-btn"
					onclick={saveAdminProfile}
					disabled={isSavingProfile || isUploadingAvatar}
				>
					{#if isSavingProfile}
						<Loader2 size={16} class="spin-icon" style="margin-right: 6px;" /> Saving...
					{:else}
						Save Changes
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.admin-profile-img {
		width: 100%;
		height: 100%;
		border-radius: 18px;
		object-fit: cover;
	}

	.admin-edit-modal {
		max-width: 440px;
		width: 90%;
		border-radius: 20px;
		padding: 24px;
		background: var(--admin-surface, #ffffff);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}

	.modal-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
	}

	.modal-header-row h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 700;
		color: var(--admin-text, #111827);
	}

	.icon-close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--admin-text-tertiary, #9ca3af);
		padding: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		transition: background 0.2s;
	}

	.icon-close-btn:hover {
		background: var(--admin-bg, #f3f4f6);
		color: var(--admin-text, #111827);
	}

	.modal-body-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.avatar-edit-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 12px 0;
	}

	.avatar-circle-box {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--admin-accent), var(--admin-indigo));
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
	}

	.avatar-circle-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}

	.avatar-initial-text {
		color: white;
		font-size: 32px;
		font-weight: 700;
	}

	.avatar-upload-loading {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.spin-icon {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.change-photo-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: var(--admin-bg, #f3f4f6);
		color: var(--admin-text, #111827);
		border: 1px solid var(--admin-border, #e5e7eb);
		padding: 8px 16px;
		border-radius: 10px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.change-photo-btn:hover {
		background: var(--admin-border, #e5e7eb);
	}

	.input-field-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
		text-align: left;
	}

	.input-field-group label {
		font-size: 13px;
		font-weight: 600;
		color: var(--admin-text-secondary, #4b5563);
	}

	.custom-admin-input {
		width: 100%;
		padding: 10px 14px;
		border-radius: 10px;
		border: 1px solid var(--admin-border, #d1d5db);
		background: var(--admin-surface, #ffffff);
		color: var(--admin-text, #111827);
		font-size: 14px;
		outline: none;
		transition: border-color 0.2s;
	}

	.custom-admin-input:focus {
		border-color: var(--admin-accent, #6366f1);
	}

	.modal-footer-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 24px;
	}

	.cancel-action-btn {
		padding: 10px 18px;
		border-radius: 10px;
		border: 1px solid var(--admin-border, #d1d5db);
		background: transparent;
		color: var(--admin-text, #374151);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
	}

	.save-action-btn {
		padding: 10px 20px;
		border-radius: 10px;
		border: none;
		background: var(--admin-accent, #6366f1);
		color: white;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
	}

	.save-action-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.settings-container {
		padding-bottom: 30px;
		animation: fadeIn 0.4s ease;
	}

	.settings-header {
		margin-bottom: 24px;
	}

	.profile-card {
		display: flex;
		align-items: center;
		background: var(--admin-surface);
		padding: 20px;
		border-radius: var(--admin-radius-lg);
		border: 1px solid var(--admin-border);
		box-shadow: var(--admin-shadow-sm);
		position: relative;
		overflow: hidden;
	}
	
	.profile-card::before {
		content: '';
		position: absolute;
		top: 0; left: 0; right: 0;
		height: 4px;
		background: linear-gradient(90deg, var(--admin-accent), var(--admin-indigo));
	}

	.profile-avatar {
		width: 56px;
		height: 56px;
		border-radius: 18px;
		background: linear-gradient(135deg, var(--admin-accent), var(--admin-indigo));
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		font-weight: 700;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		margin-right: 16px;
		font-family: var(--admin-font-display);
	}

	.profile-info {
		flex: 1;
	}

	.profile-info h2 {
		font-family: var(--admin-font-display);
		font-size: 20px;
		font-weight: 700;
		margin: 0 0 4px;
		color: var(--admin-text-primary);
	}

	.profile-info p {
		margin: 0;
		font-size: 14px;
		color: var(--admin-text-secondary);
	}

	.edit-btn {
		background: var(--admin-bg);
		border: 1px solid var(--admin-border);
		color: var(--admin-text-secondary);
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
	}

	.edit-btn:hover {
		color: var(--admin-text-primary);
		background: var(--admin-surface-hover);
		transform: rotate(15deg);
	}

	.settings-group {
		margin-bottom: 24px;
	}

	.group-title {
		font-family: var(--admin-font-display);
		font-size: 14px;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: var(--admin-text-tertiary);
		margin: 0 0 12px 12px;
		font-weight: 700;
	}

	.settings-card {
		background: var(--admin-surface);
		border-radius: var(--admin-radius-lg);
		border: 1px solid var(--admin-border);
		box-shadow: var(--admin-shadow-sm);
		overflow: hidden;
	}

	.setting-item {
		display: flex;
		align-items: center;
		padding: 16px;
		border-bottom: 1px solid var(--admin-border);
		transition: background 0.2s;
	}

	.setting-item:last-child {
		border-bottom: none;
	}

	.setting-item.clickable {
		cursor: pointer;
	}

	.setting-item.clickable:hover {
		background: var(--admin-surface-hover);
	}

	.setting-icon {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		margin-right: 14px;
		flex-shrink: 0;
	}

	.bg-indigo { background: var(--admin-indigo); }
	.bg-accent { background: var(--admin-accent); }
	.bg-gold { background: #D4AF37; }
	.bg-red { background: var(--admin-red); }
	.bg-blue { background: #007AFF; }
	.bg-green { background: var(--admin-green); }
	.bg-red-dim { background: rgba(255, 59, 48, 0.1); color: var(--admin-red); }

	.setting-details {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.setting-label {
		font-size: 16px;
		font-weight: 600;
		color: var(--admin-text-primary);
		margin-bottom: 2px;
	}

	.setting-desc {
		font-size: 13px;
		color: var(--admin-text-secondary);
	}

	.text-red { color: var(--admin-red); }

	.setting-action {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.number-input {
		width: 60px;
		padding: 6px 10px;
		border: 1px solid var(--admin-border);
		border-radius: 8px;
		background: var(--admin-bg);
		color: var(--admin-text-primary);
		text-align: center;
		font-size: 15px;
		font-weight: 600;
		font-family: var(--admin-font);
		outline: none;
	}
	
	.number-input:focus {
		border-color: var(--admin-accent);
	}

	.options-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.options-list.stacked {
		flex-direction: row;
		gap: 4px;
	}

	.radio-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: var(--admin-text-secondary);
		cursor: pointer;
	}
	
	.radio-label input {
		accent-color: var(--admin-accent);
		width: 16px; height: 16px;
	}

	.mini-input {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}
	.mini-input span {
		font-size: 10px;
		color: var(--admin-text-tertiary);
		text-transform: uppercase;
		font-weight: 700;
	}
	.mini-input input {
		width: 46px;
		padding: 4px;
		border: 1px solid var(--admin-border);
		border-radius: 6px;
		background: var(--admin-bg);
		color: var(--admin-text-primary);
		text-align: center;
		font-size: 13px;
		font-weight: 600;
	}

	/* Toggle Switch */
	.toggle-switch {
		width: 48px;
		height: 28px;
		border-radius: 28px;
		background: rgba(120, 120, 128, 0.32);
		position: relative;
		cursor: pointer;
		transition: background 0.3s ease;
	}

	.toggle-switch.on {
		background: var(--admin-green);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.toggle-switch.on .toggle-thumb {
		transform: translateX(20px);
	}

	/* Sub-settings for Notifications */
	.sub-settings-container {
		background: var(--admin-bg);
		padding: 16px;
		border-bottom: 1px solid var(--admin-border);
		animation: fadeInDown 0.3s ease;
	}

	.sub-group-title {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--admin-text-tertiary);
		margin: 0 0 12px;
		font-weight: 700;
	}

	.sub-setting-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	.sub-setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--admin-surface);
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid var(--admin-border);
		font-size: 13px;
		font-weight: 500;
		color: var(--admin-text-primary);
	}

	.sub-toggle {
		width: 32px;
		height: 18px;
		border-radius: 18px;
		background: rgba(120, 120, 128, 0.32);
		border: none;
		position: relative;
		cursor: pointer;
		transition: background 0.3s ease;
		padding: 0;
	}

	.sub-toggle.on {
		background: var(--admin-green);
	}

	.sub-toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: white;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.sub-toggle.on .sub-toggle-thumb {
		transform: translateX(14px);
	}

	/* Version Info */
	.app-version-info {
		text-align: center;
		margin-top: 32px;
		color: var(--admin-text-tertiary);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.app-version-info p {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: var(--admin-text-secondary);
	}
	
	.app-version-info span {
		font-size: 12px;
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		animation: fadeIn 0.2s ease;
	}

	.modal-content {
		background: var(--admin-surface);
		border-radius: 24px;
		padding: 32px;
		max-width: 360px;
		width: 100%;
		text-align: center;
		box-shadow: var(--admin-shadow-xl);
		border: 1px solid var(--admin-border);
		animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.modal-header h3 {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		color: var(--admin-text-primary);
	}

	.modal-body p {
		font-size: 14px;
		color: var(--admin-text-secondary);
		line-height: 1.5;
		margin: 16px 0;
	}

	.path-box {
		background: var(--admin-bg);
		border: 1px solid var(--admin-border);
		padding: 12px;
		border-radius: 8px;
		font-family: monospace;
		font-size: 12px;
		color: var(--admin-accent);
		margin-bottom: 16px;
	}

	.primary-btn {
		background: var(--admin-accent);
		color: white;
		border: none;
		padding: 14px 24px;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 600;
		width: 100%;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.primary-btn:active {
		transform: scale(0.96);
	}

	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
	@keyframes fadeInDown {
		from { opacity: 0; transform: translateY(-10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	@keyframes zoomIn {
		from { opacity: 0; transform: scale(0.9); }
		to { opacity: 1; transform: scale(1); }
	}
</style>
