<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { appSettings } from '$lib/stores/appSettings';
	import { Volume2, VolumeX, Sparkles } from 'lucide-svelte';

	let visible = $state(false);
	let isMuted = $state(true);
	let sectionRef: HTMLElement;
	let player: any = null;
	let isReady = false;
	let observer: IntersectionObserver;

	let videoUrl = $derived($appSettings.promoVideoUrl);
	let isEnabled = $derived($appSettings.promoVideoEnabled);

	let videoId = $derived.by(() => {
		if (!videoUrl) return null;
		const match = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
		return match ? match[1] : null;
	});

	let isShorts = $derived.by(() => {
		if (!videoUrl) return false;
		return videoUrl.includes('/shorts/');
	});

	// Wait for YouTube API to load
	function loadYoutubeApi() {
		if (typeof window === 'undefined') return;
		if (!(window as any).YT && !document.getElementById('yt-api')) {
			const tag = document.createElement('script');
			tag.id = 'yt-api';
			tag.src = 'https://www.youtube.com/iframe_api';
			document.body.appendChild(tag);
		}
	}

	$effect(() => {
		const id = videoId;
		const win = window as any;
		
		if (!isEnabled || !id) {
			if (player) {
				player.destroy();
				player = null;
				isReady = false;
			}
			return;
		}

		if (isEnabled && id && visible) {
			if (!player && win.YT && win.YT.Player) {
				player = new win.YT.Player('youtube-player', {
					videoId: id,
					playerVars: {
						autoplay: 1,
						controls: 0,
						mute: 1,
						loop: 1,
						playlist: id,
						modestbranding: 1,
						rel: 0,
						showinfo: 0,
						iv_load_policy: 3,
						playsinline: 1
					},
					events: {
						onReady: (event: any) => {
							isReady = true;
							event.target.playVideo();
							if (isMuted) {
								event.target.mute();
							} else {
								event.target.unMute();
							}
						},
						onStateChange: (event: any) => {
							if (event.data === win.YT.PlayerState.ENDED) {
								event.target.playVideo(); // Enforce loop
							}
						}
					}
				});
			} else if (player && isReady) {
				player.playVideo();
			}
		} else if (player && isReady && !visible) {
			player.pauseVideo();
		}
	});

	onMount(() => {
		loadYoutubeApi();

		const checkYT = setInterval(() => {
			const win = window as any;
			if (win.YT && win.YT.Player && sectionRef) {
				clearInterval(checkYT);
				
				observer = new IntersectionObserver((entries) => {
					visible = entries[0].isIntersecting;
				}, { threshold: 0.4 }); // Trigger when 40% visible
				
				observer.observe(sectionRef);
			}
		}, 200);

		return () => {
			clearInterval(checkYT);
			if (observer) observer.disconnect();
			if (player) player.destroy();
		};
	});

	function toggleMute() {
		if (!player || !isReady) return;
		isMuted = !isMuted;
		if (isMuted) {
			player.mute();
		} else {
			player.unMute();
			player.setVolume(100);
		}
	}
</script>

{#if isEnabled && videoId}
	<section bind:this={sectionRef} class="promo-video-section container section-padding">
		<div class="section-header">
			<h2 class="section-title">
				<Sparkles size="24" class="title-icon" />
				Featured Spotlight
			</h2>
			<p class="section-subtitle">Discover the BeWell experience</p>
		</div>

		<div class="video-wrapper glow-card {isShorts ? 'is-shorts' : ''}">
			<div class="player-container">
				<!-- The YouTube API will replace this div with an iframe -->
				<div id="youtube-player"></div>
			</div>
			
			<div class="video-overlay">
				<button class="mute-btn" onclick={toggleMute} aria-label="Toggle sound">
					{#if isMuted}
						<VolumeX size="24" color="#fff" />
					{:else}
						<Volume2 size="24" color="#fff" />
					{/if}
				</button>
			</div>
		</div>
	</section>
{/if}

<style>
	.promo-video-section {
		margin-bottom: 20px;
	}

	.section-padding {
		padding-top: 40px;
		padding-bottom: 40px;
	}

	.section-header {
		text-align: center;
		margin-bottom: 30px;
	}

	.section-title {
		font-size: 2rem;
		margin-bottom: 8px;
		background: var(--gradient-gold);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		display: inline-flex;
		align-items: center;
		gap: 12px;
	}

	.title-icon {
		color: var(--color-accent-gold);
	}

	.section-subtitle {
		color: var(--color-text-secondary);
		font-size: 1rem;
	}

	.video-wrapper {
		position: relative;
		width: 100%;
		border-radius: 24px; /* More rounded and soft */
		overflow: hidden;
		background: #000;
		/* Softer, more integrated shadow rather than overly elevated */
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); 
		border: 1px solid rgba(255, 255, 255, 0.05); /* Very subtle edge */
		aspect-ratio: 16 / 9;
		transition: transform var(--transition-bounce), box-shadow var(--transition-smooth);
	}

	.video-wrapper.is-shorts {
		aspect-ratio: 9 / 16;
		max-height: 70vh;
		width: auto;
		margin: 0 auto;
	}

	.video-wrapper:hover {
		transform: translateY(-5px);
		box-shadow: 0 25px 60px rgba(212, 175, 55, 0.2);
	}

	.player-container {
		position: absolute;
		top: -2%; /* Bleed over the edges */
		left: -2%;
		width: 104%;
		height: 104%;
		pointer-events: none; /* Let overlay handle clicks */
	}

	.player-container :global(iframe) {
		width: 100%;
		height: 100%;
		border: none;
		/* Scale up slightly to completely eliminate any YouTube-injected black borders from rounding */
		transform: scale(1.02);
		transform-origin: center;
	}

	.video-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 25%);
		display: flex;
		align-items: flex-end;
		justify-content: flex-end;
		padding: 20px;
		pointer-events: none;
	}

	.mute-btn {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		pointer-events: auto; /* Re-enable clicks just for the button */
		transition: all 0.2s ease;
	}

	.mute-btn:hover {
		background: rgba(212, 175, 55, 0.8);
		transform: scale(1.1);
		border-color: var(--color-accent-gold);
	}
</style>
