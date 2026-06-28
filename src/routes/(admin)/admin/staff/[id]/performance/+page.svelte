<script lang="ts">
	import { page } from '$app/state';
	import { allBookings, allUsers, getUserDisplayName } from '$lib/stores/adminData';
	import PerformanceDashboard from '$lib/components/PerformanceDashboard.svelte';

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
