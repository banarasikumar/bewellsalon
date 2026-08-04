<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/announcement', { replaceState: true });
	});
</script>

<div style="min-height: 100vh; background: #0b0f19; display: flex; align-items: center; justify-content: center; color: #94a3b8;">
	<span>Loading Announcement...</span>
</div>
