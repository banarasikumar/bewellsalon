<script lang="ts">
	import { staffUser } from '$lib/stores/staffAuth';
	import { myCompletedBookings } from '$lib/stores/staffData';
	import PerformanceDashboard from '$lib/components/PerformanceDashboard.svelte';
	import { db } from '$lib/firebase';
	import { doc, getDoc } from 'firebase/firestore';
	import { onMount } from 'svelte';

	let staffProfile = $state<any>(null);

	onMount(async () => {
		if ($staffUser?.uid) {
			const docRef = doc(db, 'users', $staffUser.uid);
			const snap = await getDoc(docRef);
			if (snap.exists()) {
				staffProfile = snap.data();
			}
		}
	});

	let mergedStaff = $derived(staffProfile ? { ...$staffUser, ...staffProfile } : $staffUser);
</script>

<PerformanceDashboard 
	bookings={$myCompletedBookings} 
	staff={mergedStaff} 
	settingsUrl="/staff/profile"
	title="My Stats"
/>
