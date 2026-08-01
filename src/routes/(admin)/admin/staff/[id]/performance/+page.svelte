<script lang="ts">
	import { page } from '$app/state';
	import { allBookings, allUsers, getUserDisplayName } from '$lib/stores/adminData';
	import PerformanceDashboard from '$lib/components/PerformanceDashboard.svelte';
	import { headerActions } from '$lib/stores/adminUI';
	import { untrack } from 'svelte';
	import { Percent, Tag, X } from 'lucide-svelte';
	import { db } from '$lib/firebase';
	import { doc, updateDoc } from 'firebase/firestore';

	let staffId = $derived(page.params.id);

	let targetStaff = $derived(
		$allUsers.find(u => u.id === staffId) || null
	);

	let staffBookings = $derived(
		$allBookings.filter(b => b.staffId === staffId && b.status === 'completed')
	);
	
	let staffName = $derived.by(() => {
		if (!targetStaff) return 'Staff';
		let baseName = getUserDisplayName(targetStaff);
		if (baseName === 'Guest User' && targetStaff.email) {
			baseName = targetStaff.email.split('@')[0];
		}
		return baseName;
	});

	// --- Modal State ---
	let showCommissionModal = $state(false);
	let editCommissionValue = $state(20);
	let editCommissionEnabled = $state(true);
	let isSaving = $state(false);

	$effect(() => {
		headerActions.set([
			{
				label: 'Edit Commission',
				icon: Percent,
				handler: () => {
					if (targetStaff) {
						editCommissionValue = Number(targetStaff.commission || targetStaff.commissionRate || 20);
						editCommissionEnabled = targetStaff.commissionEnabled !== false;
					}
					showCommissionModal = true;
				}
			}
		]);

		return () => {
			untrack(() => headerActions.set([]));
		};
	});

	async function saveCommission() {
		if (!targetStaff) return;
		isSaving = true;
		try {
			await updateDoc(doc(db, 'users', targetStaff.id), {
				commissionRate: editCommissionValue,
				commission: editCommissionValue,
				commissionEnabled: editCommissionEnabled
			});
			showCommissionModal = false;
		} catch (err) {
			console.error('Failed to update commission:', err);
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>{staffName}'s Performance - Admin Dashboard</title>
</svelte:head>

<PerformanceDashboard 
	bookings={staffBookings} 
	staff={targetStaff} 
	title="Performance"
	backUrl="/admin/stats"
	showHeader={false}
/>

{#if showCommissionModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="admin-modal-overlay" onclick={() => showCommissionModal = false}>
		<div class="admin-modal-content s-glass" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Edit Commission</h3>
				<button class="close-btn" onclick={() => showCommissionModal = false}>
					<X size={20} />
				</button>
			</div>
			<div class="modal-body">
				<div class="form-group toggle-group" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
					<label for="comm-enable" style="margin: 0;">Enable Commission</label>
					<label class="toggle-switch">
						<input type="checkbox" id="comm-enable" bind:checked={editCommissionEnabled} />
						<span class="slider"></span>
					</label>
				</div>

				{#if editCommissionEnabled}
					<div class="form-group">
						<label for="comm">Commission Rate (%)</label>
						<input id="comm" type="number" min="0" max="100" bind:value={editCommissionValue} class="admin-input" />
					</div>
				{/if}
			</div>
			<div class="modal-footer">
				<button class="admin-btn-secondary" onclick={() => showCommissionModal = false}>Cancel</button>
				<button class="admin-btn-primary" onclick={saveCommission} disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.admin-modal-overlay {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0,0,0,0.5);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}
	.admin-modal-content {
		background: var(--admin-surface);
		border-radius: 16px;
		width: 100%;
		max-width: 400px;
		display: flex;
		flex-direction: column;
		box-shadow: 0 12px 32px rgba(0,0,0,0.15);
	}
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 24px;
		border-bottom: 1px solid var(--admin-border);
	}
	.modal-header h3 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
	}
	.close-btn {
		background: none;
		border: none;
		color: var(--admin-text-secondary);
		cursor: pointer;
		padding: 4px;
		display: flex;
	}
	.modal-body {
		padding: 24px;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.form-group label {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--admin-text-secondary);
	}
	.admin-input {
		background: var(--admin-bg);
		border: 1px solid var(--admin-border);
		border-radius: 8px;
		padding: 12px;
		font-size: 1rem;
		color: var(--admin-text-primary);
		outline: none;
	}
	.admin-input:focus {
		border-color: var(--admin-accent);
	}
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 16px 24px;
		border-top: 1px solid var(--admin-border);
	}
	.admin-btn-secondary {
		background: transparent;
		border: 1px solid var(--admin-border);
		color: var(--admin-text-primary);
		padding: 10px 16px;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
	}
	.admin-btn-primary {
		background: var(--admin-accent);
		border: none;
		color: white;
		padding: 10px 16px;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
	}
	.admin-btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	/* Toggle Switch Styles */
	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 44px;
		height: 24px;
	}
	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}
	.toggle-switch .slider {
		position: absolute;
		cursor: pointer;
		top: 0; left: 0; right: 0; bottom: 0;
		background-color: var(--admin-border);
		transition: .3s;
		border-radius: 24px;
	}
	.toggle-switch .slider:before {
		position: absolute;
		content: "";
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background-color: white;
		transition: .3s;
		border-radius: 50%;
	}
	.toggle-switch input:checked + .slider {
		background-color: var(--admin-accent);
	}
	.toggle-switch input:checked + .slider:before {
		transform: translateX(20px);
	}
</style>
