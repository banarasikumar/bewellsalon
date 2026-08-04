<script lang="ts">
	import { appSettings } from '$lib/stores/appSettings';
	import { showToast } from '$lib/stores/toast';
	import {
		ArrowLeft,
		Sparkles,
		Calendar,
		Share2,
		Copy,
		Check,
		Tag,
		Maximize2,
		X,
		ShoppingBag
	} from 'lucide-svelte';
	import { fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';

	import { saveLoginState } from '$lib/services/authService';

	const promoText = $derived(
		$appSettings.promoTickerText ||
			'✨ FESTIVE SPECIAL: Get 15% OFF on all Premium Beauty Packages this week! ✨'
	);
	const color1 = $derived($appSettings.promoTickerColor1 || '#9333ea');
	const color2 = $derived($appSettings.promoTickerColor2 || '#db2777');
	const bannerImage = $derived($appSettings.promoTickerImage || '');
	const mediaType = $derived($appSettings.promoTickerMediaType || 'image');
	const videoUrl = $derived($appSettings.promoTickerVideoUrl || '');

	function parseYouTubeEmbedUrl(url: string): { embedUrl: string | null; isShorts: boolean } {
		if (!url) return { embedUrl: null, isShorts: false };
		try {
			if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
				return { embedUrl: null, isShorts: false };
			}
			
			let videoId = '';
			let isShorts = false;
			
			if (url.includes('/shorts/')) {
				isShorts = true;
				const parts = url.split('/shorts/');
				if (parts[1]) {
					videoId = parts[1].split('?')[0].split('&')[0];
				}
			} else if (url.includes('youtu.be/')) {
				const parts = url.split('youtu.be/');
				if (parts[1]) {
					videoId = parts[1].split('?')[0].split('&')[0];
				}
			} else if (url.includes('v=')) {
				const searchParams = new URLSearchParams(url.split('?')[1]);
				videoId = searchParams.get('v') || '';
			} else if (url.includes('/embed/')) {
				const parts = url.split('/embed/');
				if (parts[1]) {
					videoId = parts[1].split('?')[0].split('&')[0];
				}
			}
			
			if (videoId) {
				return {
					embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
					isShorts
				};
			}
		} catch (e) {
			console.error('Failed to parse YouTube URL:', e);
		}
		return { embedUrl: null, isShorts: false };
	}

	const ytInfo = $derived(parseYouTubeEmbedUrl(videoUrl));

	let copied = $state(false);
	let lightboxOpen = $state(false);

	function goBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			window.history.back();
		} else {
			goto('/');
		}
	}

	async function copyCode() {
		try {
			await navigator.clipboard.writeText('BEWELL15');
			copied = true;
			showToast('Promo code BEWELL15 copied to clipboard!', 'success');
			setTimeout(() => {
				copied = false;
			}, 3000);
		} catch {
			showToast('Promo code: BEWELL15', 'success');
		}
	}

	async function handleBookSpecialOffer() {
		try {
			if (typeof navigator !== 'undefined' && navigator.clipboard) {
				await navigator.clipboard.writeText('BEWELL15');
			}
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('active_promo_code', 'BEWELL15');
			}
			saveLoginState('/booking?promo=BEWELL15');
			showToast('Promo code BEWELL15 applied! Redirecting to booking...', 'success');
		} catch (e) {
			console.log('Error setting promo state:', e);
		}
		goto('/booking?promo=BEWELL15');
	}

	function handleExploreServices() {
		goto('/services');
	}

	async function shareAnnouncement() {
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share({
					title: 'BeWell Salon Announcement',
					text: promoText,
					url: window.location.href
				});
			} catch (e) {
				console.log('Share canceled', e);
			}
		} else {
			copyCode();
		}
	}
</script>

<svelte:head>
	<title>Special Announcement & Offers - BeWell Salon</title>
	<meta name="description" content="Check out our latest special announcement and exclusive beauty offers." />
</svelte:head>

<div class="announcement-page-wrapper">
	<!-- TOP HEADER BAR -->
	<header class="announcement-header">
		<button class="back-btn" onclick={goBack} aria-label="Go Back">
			<ArrowLeft size="20" />
		</button>
		<div class="header-title-box">
			<span class="header-tag"><Sparkles size="12" /> SPECIAL ANNOUNCEMENT</span>
			<h1>Exclusive Promo & Offer</h1>
		</div>
		<button class="share-btn" onclick={shareAnnouncement} aria-label="Share Announcement">
			<Share2 size="18" />
		</button>
	</header>

	<main class="announcement-content" in:fade={{ duration: 300 }}>
		<!-- DEDICATED ANNOUNCEMENT MEDIA CARD -->
		<div class="poster-container-9-16" in:scale={{ duration: 400, start: 0.95 }}>
			{#if mediaType === 'video' && ytInfo.embedUrl}
				<div class={ytInfo.isShorts ? 'video-wrapper-shorts' : 'video-wrapper-landscape'}>
					<iframe
						src={ytInfo.embedUrl}
						title="Announcement Video"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
						class="announcement-video-iframe"
					></iframe>
					<div class="aspect-badge">{ytInfo.isShorts ? 'Shorts 9:16' : 'Video 16:9'}</div>
				</div>
			{:else if bannerImage}
				<div class="image-wrapper-9-16" onclick={() => (lightboxOpen = true)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && (lightboxOpen = true)}>
					<img src={bannerImage} alt="Special Announcement Banner" class="poster-img-9-16" />
					<div class="zoom-overlay-hint">
						<Maximize2 size="18" />
						<span>Tap to view full screen</span>
					</div>
					<div class="aspect-badge">9:16 HD</div>
				</div>
			{:else}
				<!-- BRANDED 9:16 FALLBACK GRAPHIC CARD -->
				<div
					class="fallback-poster-9-16"
					style="background: linear-gradient(145deg, {color1}, {color2}, #0f172a);"
				>
					<div class="fallback-glow-circle"></div>
					<div class="fallback-content">
						<div class="salon-badge">
							<Sparkles size="16" />
							<span>BEWELL BEAUTY & SPA</span>
						</div>
						<div class="offer-icon-ring">
							<Tag size="38" color="#ffffff" />
						</div>
						<h2 class="fallback-title">SPECIAL OFFER</h2>
						<p class="fallback-text">{promoText}</p>
						<div class="promo-code-chip">
							<span class="code-label">PROMO CODE:</span>
							<span class="code-val">BEWELL15</span>
						</div>
					</div>
					<div class="aspect-badge">9:16 Poster</div>
				</div>
			{/if}
		</div>

		<!-- ANNOUNCEMENT DETAILS CARD -->
		<div class="details-card glass-panel">
			<div class="card-badge" style="background: linear-gradient(135deg, {color1}, {color2});">
				<Sparkles size="14" />
				<span>FEATURED PROMOTION</span>
			</div>

			<h2 class="announcement-heading">{promoText}</h2>

			<p class="announcement-description">
				Take advantage of our exclusive salon experience! Book your favorite hair, skin, or wellness package today and enjoy premium services with our expert stylists.
			</p>

			<!-- PROMO CODE BOX -->
			<div class="promo-code-bar">
				<div class="code-info">
					<span class="code-title">Coupon Code:</span>
					<span class="code-text">BEWELL15</span>
				</div>
				<button class="btn-copy-code" onclick={copyCode}>
					{#if copied}
						<Check size="16" />
						<span>Copied!</span>
					{:else}
						<Copy size="16" />
						<span>Copy Code</span>
					{/if}
				</button>
			</div>

			<!-- ACTION BUTTONS -->
			<div class="action-buttons-group">
				<button type="button" class="btn-primary-action" onclick={handleBookSpecialOffer} style="background: linear-gradient(135deg, {color1}, {color2});">
					<Calendar size="18" />
					<span>Book Special Offer Now</span>
				</button>
				<button type="button" class="btn-secondary-action" onclick={handleExploreServices}>
					<ShoppingBag size="18" />
					<span>Explore All Services</span>
				</button>
			</div>
		</div>
	</main>
</div>

<!-- FULLSCREEN LIGHTBOX MODAL -->
{#if lightboxOpen && bannerImage}
	<div class="lightbox-overlay" in:fade={{ duration: 200 }} out:fade={{ duration: 150 }} onclick={() => (lightboxOpen = false)} role="presentation">
		<div class="lightbox-content" onclick={(e) => e.stopPropagation()} role="presentation">
			<button class="btn-close-lightbox" onclick={() => (lightboxOpen = false)} aria-label="Close Preview">
				<X size="22" />
			</button>
			<img src={bannerImage} alt="Announcement Poster Full view" class="lightbox-img-9-16" />
		</div>
	</div>
{/if}

<style>
	.announcement-page-wrapper {
		min-height: 100vh;
		background: #0b0f19;
		color: #f8fafc;
		padding-bottom: 60px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.announcement-header {
		width: 100%;
		max-width: 600px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		position: sticky;
		top: 0;
		background: rgba(11, 15, 25, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		z-index: 100;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.back-btn, .share-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: #f1f5f9;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.back-btn:hover, .share-btn:hover {
		background: rgba(255, 255, 255, 0.16);
		transform: translateY(-1px);
	}

	.header-title-box {
		text-align: center;
	}

	.header-tag {
		font-size: 10.5px;
		font-weight: 800;
		color: #c084fc;
		letter-spacing: 1px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		margin-bottom: 2px;
	}

	.header-title-box h1 {
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0;
		color: #ffffff;
	}

	.announcement-content {
		width: 100%;
		max-width: 480px;
		padding: 20px 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
	}

	/* DEDICATED 9:16 ASPECT RATIO POSTER CONTAINER */
	.poster-container-9-16 {
		width: 100%;
		max-width: 380px;
		display: flex;
		justify-content: center;
	}

	.image-wrapper-9-16 {
		width: 100%;
		aspect-ratio: 9 / 16;
		border-radius: 24px;
		overflow: hidden;
		position: relative;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(147, 51, 234, 0.25);
		border: 1px solid rgba(255, 255, 255, 0.15);
		cursor: pointer;
		background: #1e293b;
	}

	.poster-img-9-16 {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		transition: transform 0.4s ease;
	}

	.image-wrapper-9-16:hover .poster-img-9-16 {
		transform: scale(1.03);
	}

	.zoom-overlay-hint {
		position: absolute;
		bottom: 14px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(15, 23, 42, 0.75);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 6px 14px;
		border-radius: 20px;
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		font-weight: 600;
		color: #ffffff;
		pointer-events: none;
	}

	.aspect-badge {
		position: absolute;
		top: 14px;
		right: 14px;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(6px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #e2e8f0;
		font-size: 10.5px;
		font-weight: 800;
		padding: 4px 10px;
		border-radius: 12px;
		letter-spacing: 0.5px;
	}

	/* FALLBACK 9:16 BRANDED CARD */
	.fallback-poster-9-16 {
		width: 100%;
		aspect-ratio: 9 / 16;
		border-radius: 24px;
		padding: 28px 20px;
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px rgba(219, 39, 119, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.fallback-glow-circle {
		position: absolute;
		top: -30%;
		left: -30%;
		width: 160%;
		height: 160%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
		pointer-events: none;
	}

	.fallback-content {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.salon-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(10px);
		padding: 6px 14px;
		border-radius: 20px;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 1px;
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.25);
	}

	.offer-icon-ring {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		border: 2px solid rgba(255, 255, 255, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 25px rgba(0,0,0,0.3);
	}

	.fallback-title {
		font-size: 1.6rem;
		font-weight: 900;
		color: #ffffff;
		letter-spacing: 1px;
		margin: 0;
		text-transform: uppercase;
		text-shadow: 0 4px 15px rgba(0,0,0,0.4);
	}

	.fallback-text {
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.95);
		margin: 0;
		max-width: 280px;
	}

	.promo-code-chip {
		background: rgba(0, 0, 0, 0.4);
		border: 1px dashed rgba(255, 255, 255, 0.5);
		padding: 8px 16px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 8px;
	}

	.code-label {
		font-size: 11px;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.7);
	}

	.code-val {
		font-size: 14px;
		font-weight: 900;
		color: #facc15;
		letter-spacing: 1px;
	}

	/* DETAILS CARD BELOW POSTER */
	.details-card {
		width: 100%;
		background: rgba(15, 23, 42, 0.75);
		backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 24px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
	}

	.card-badge {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.5px;
		color: #ffffff;
	}

	.announcement-heading {
		font-size: 1.25rem;
		font-weight: 800;
		color: #ffffff;
		line-height: 1.4;
		margin: 0;
	}

	.announcement-description {
		font-size: 0.9rem;
		color: #94a3b8;
		line-height: 1.6;
		margin: 0;
	}

	.promo-code-bar {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		padding: 12px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.code-info {
		display: flex;
		flex-direction: column;
	}

	.code-title {
		font-size: 11px;
		color: #64748b;
		font-weight: 600;
	}

	.code-text {
		font-size: 15px;
		font-weight: 800;
		color: #a855f7;
		letter-spacing: 1px;
	}

	.btn-copy-code {
		background: rgba(168, 85, 247, 0.15);
		border: 1px solid rgba(168, 85, 247, 0.3);
		color: #c084fc;
		padding: 8px 14px;
		border-radius: 10px;
		font-size: 12.5px;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-copy-code:hover {
		background: rgba(168, 85, 247, 0.25);
		color: #ffffff;
	}

	.action-buttons-group {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 8px;
	}

	.btn-primary-action {
		width: 100%;
		padding: 14px;
		border-radius: 14px;
		color: #ffffff;
		font-weight: 800;
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		text-decoration: none;
		box-shadow: 0 8px 20px rgba(147, 51, 234, 0.35);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.btn-primary-action:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 25px rgba(147, 51, 234, 0.45);
	}

	.btn-secondary-action {
		width: 100%;
		padding: 12px;
		border-radius: 14px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: #e2e8f0;
		font-weight: 700;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.btn-secondary-action:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}

	/* LIGHTBOX MODAL */
	.lightbox-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.92);
		backdrop-filter: blur(12px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.lightbox-content {
		position: relative;
		max-height: 90vh;
		max-width: 90vw;
		aspect-ratio: 9 / 16;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lightbox-img-9-16 {
		width: 100%;
		height: 100%;
		object-fit: contain;
		border-radius: 16px;
		box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
	}

	.btn-close-lightbox {
		position: absolute;
		top: -45px;
		right: 0;
		background: rgba(255, 255, 255, 0.2);
		border: none;
		color: #ffffff;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.btn-close-lightbox:hover {
		background: rgba(255, 255, 255, 0.4);
	}

	/* ANNOUNCEMENT VIDEO WRAPPERS */
	.video-wrapper-shorts {
		width: 100%;
		max-width: 380px;
		aspect-ratio: 9 / 16;
		border-radius: 24px;
		overflow: hidden;
		position: relative;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), 0 0 25px rgba(147, 51, 234, 0.25);
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: #000;
		margin: 0 auto;
	}

	.video-wrapper-landscape {
		width: 100%;
		max-width: 580px;
		aspect-ratio: 16 / 9;
		border-radius: 20px;
		overflow: hidden;
		position: relative;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), 0 0 25px rgba(147, 51, 234, 0.25);
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: #000;
		margin: 0 auto;
	}

	.announcement-video-iframe {
		width: 100%;
		height: 100%;
		border: none;
	}
</style>
