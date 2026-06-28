<script lang="ts">
	import { staffUser } from '$lib/stores/staffAuth';
	import { myCompletedBookings } from '$lib/stores/staffData';
	import PerformanceDashboard from '$lib/components/PerformanceDashboard.svelte';
</script>

<PerformanceDashboard 
	bookings={$myCompletedBookings} 
	staff={$staffUser} 
	settingsUrl="/staff/profile"
	title="My Stats"
/>
