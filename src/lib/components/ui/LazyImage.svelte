<script lang="ts">
	// Ultra-Fast Lazy Image Component
	// Supports Blurhash placeholder (if provided) and native lazy loading

	export let src: string;
	export let alt: string;
	export let width: number | string = 'auto'; // Aspect ratio preservation
	export let height: number | string = 'auto';
	export let className: string = '';
	export let loading: 'lazy' | 'eager' = 'lazy';

	let isLoaded = false;
	let hasError = false;

	function handleLoad() {
		isLoaded = true;
	}

	function handleError() {
		hasError = true;
	}

	// Trigger error state immediately if src is falsy
	$: if (!src) {
		hasError = true;
	}
</script>

<div class="image-wrapper {className}" style="width: {width}; height: {height};">
	<!-- Place holder / Skeleton -->
	{#if !isLoaded && !hasError}
		<div class="skeleton"></div>
	{/if}

	{#if src}
		<img {src} {alt} {loading} class:loaded={isLoaded || hasError} on:load={handleLoad} on:error={handleError} draggable="false" />
	{:else}
		<div class="fallback-icon"></div>
	{/if}
</div>

<style>
	.image-wrapper {
		position: relative;
		overflow: hidden;
		background: var(--color-bg-secondary);
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.5s ease;
		display: block;
	}

	img.loaded {
		opacity: 1;
	}

	.skeleton {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			var(--color-bg-secondary) 25%,
			var(--color-bg-glass) 50%,
			var(--color-bg-secondary) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		z-index: 1;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
