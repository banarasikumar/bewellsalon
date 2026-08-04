<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	interface StaffMember {
		id: string;
		name: string;
		specialty: string;
		photoURL: string;
		role: string;
	}

	let staff: StaffMember[] = $state([]);
	let isLoading = $state(true);
	let scrollContainer: HTMLElement;

	onMount(async () => {
		try {
			const res = await fetch('/api/staff');
			if (res.ok) {
				const data = await res.json();
				staff = data.staff || [];
			}
		} catch (error) {
			console.error('[StaffSpotlight] Failed to fetch staff:', error);
		} finally {
			isLoading = false;
		}
	});

	const scroll = (direction: number) => {
		if (scrollContainer) {
			const scrollAmount = 300;
			scrollContainer.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
		}
	};

	function bookWithStaff(member: StaffMember) {
		goto(`/booking?staffId=${encodeURIComponent(member.id)}&staffName=${encodeURIComponent(member.name)}`);
	}

	const avatarGradients = [
		'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
		'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)',
		'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)',
		'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)',
		'linear-gradient(135deg, #FF8008 0%, #FFC837 100%)',
		'linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)',
		'linear-gradient(135deg, #00B4DB 0%, #0083B0 100%)',
		'linear-gradient(135deg, #F355DA 0%, #6E0DD0 100%)',
		'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)',
		'linear-gradient(135deg, #1D976C 0%, #93F9B9 100%)',
		'linear-gradient(135deg, #DA22FF 0%, #9733EE 100%)',
		'linear-gradient(135deg, #E52D27 0%, #B31217 100%)'
	];

	function getAvatarBg(name: string): string {
		if (!name) return avatarGradients[0];
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		const index = Math.abs(hash) % avatarGradients.length;
		return avatarGradients[index];
	}
</script>

<section class="staff-section container section-padding" id="team">
	<div class="section-header">
		<h2 class="section-title">
			<span class="title-decoration">💇</span>
			Meet Our Expert Team
			<span class="title-decoration">💇</span>
		</h2>
		<p class="section-subtitle">Passionate professionals dedicated to your beauty</p>
	</div>

	{#if isLoading}
		<div class="loading-state">
			<div class="loading-shimmer"></div>
			<div class="loading-shimmer"></div>
			<div class="loading-shimmer"></div>
		</div>
	{:else if staff.length === 0}
		<p class="empty-state">Our team info is being updated. Check back soon!</p>
	{:else}
		<div class="carousel-wrapper">
			<button class="nav-btn prev" onclick={() => scroll(-1)}>❮</button>

			<div class="staff-carousel" bind:this={scrollContainer}>
				{#each staff as member (member.id)}
					<div class="staff-card">
						<div class="photo-wrapper">
							<img 
								src={member.photoURL || ''} 
								alt={member.name} 
								loading="lazy" 
								style={member.photoURL ? '' : 'display:none;'}
								referrerpolicy="no-referrer"
								onerror={(e) => { 
									e.currentTarget.style.display = 'none'; 
									const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
									if (sibling) sibling.style.display = 'flex';
								}}
							/>
							<div 
								class="avatar-fallback" 
								style="{member.photoURL ? 'display:none;' : 'display:flex;'} background: {getAvatarBg(member.name || member.id)};"
							>
								<span>{member.name ? member.name.charAt(0).toUpperCase() : '?'}</span>
							</div>
						</div>
						<div class="info">
							<div class="name-row">
								<h3>{member.name}</h3>
							</div>
							<p class="role">{member.role}</p>
							{#if member.specialty}
								<div class="specialty-badge">{member.specialty}</div>
							{/if}
							<button
								class="book-btn"
								onclick={() => bookWithStaff(member)}
							>Book with {member.name.split(' ')[0]}</button>
						</div>
					</div>
				{/each}
			</div>

			<button class="nav-btn next" onclick={() => scroll(1)}>❯</button>
		</div>
	{/if}
</section>

<style>
	.section-padding {
		padding-top: 60px;
		padding-bottom: 60px;
	}
	.section-header {
		text-align: center;
		margin-bottom: 40px;
	}
	.section-title {
		font-size: 2rem;
		margin-bottom: 8px;
		color: var(--color-text-primary);
		display: inline-flex;
		justify-content: center;
		gap: 10px;
	}
	.section-subtitle {
		color: var(--color-text-secondary);
	}

	/* Loading & Empty States */
	.loading-state {
		display: flex;
		gap: 20px;
		overflow: hidden;
		padding: 0 16px;
	}
	.loading-shimmer {
		flex: 0 0 200px;
		height: 310px;
		background: var(--color-bg-secondary);
		border-radius: var(--radius-lg);
		animation: shimmer 1.5s ease-in-out infinite alternate;
	}
	@keyframes shimmer {
		0% { opacity: 0.4; }
		100% { opacity: 0.8; }
	}
	.empty-state {
		text-align: center;
		color: var(--color-text-secondary);
		padding: 40px;
	}

	.carousel-wrapper {
		position: relative;
	}

	.staff-carousel {
		display: flex;
		gap: 20px;
		overflow-x: auto;
		padding-bottom: 20px;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
	}
	.staff-carousel::-webkit-scrollbar {
		display: none;
	}

	.staff-card {
		flex: 0 0 200px;
		background: var(--color-bg-secondary);
		border-radius: var(--radius-lg, 16px);
		overflow: hidden;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
		transition: transform 0.3s, box-shadow 0.3s;
		scroll-snap-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.staff-card:hover {
		transform: translateY(-5px);
		box-shadow: var(--shadow-glass, 0 8px 25px rgba(0, 0, 0, 0.2));
	}

	.photo-wrapper {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		margin: 20px auto 8px auto;
		overflow: hidden;
		position: relative;
		border: 3px solid var(--color-accent-gold, #d4af37);
		box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
		background: var(--surface-3, #2a2a2a);
		flex-shrink: 0;
	}

	.photo-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
		transition: transform 0.5s;
	}

	.staff-card:hover .photo-wrapper img {
		transform: scale(1.08);
	}

	/* Fallback avatar when no photo */
	.avatar-fallback {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
	}

	.avatar-fallback span {
		font-size: 2.8rem;
		font-weight: 800;
		color: #ffffff;
		font-family: var(--font-heading);
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
	}

	.info {
		padding: 12px 14px 18px 14px;
		width: 100%;
		box-sizing: border-box;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.name-row {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 4px;
		width: 100%;
	}

	.name-row h3 {
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
		text-align: center;
		word-break: break-word;
	}

	.role {
		color: var(--color-accent-gold);
		font-size: 0.85rem;
		margin-bottom: 8px;
		text-align: center;
	}

	.specialty-badge {
		display: inline-block;
		background: var(--color-surface, rgba(255, 255, 255, 0.08));
		color: var(--color-text-secondary);
		font-size: 0.75rem;
		padding: 3px 10px;
		border-radius: 12px;
		margin-bottom: 12px;
		text-align: center;
	}

	.book-btn {
		display: block;
		width: 100%;
		text-align: center;
		background: var(--color-accent-gold);
		color: black;
		padding: 8px 12px;
		border-radius: var(--radius-full, 9999px);
		text-decoration: none;
		font-weight: 600;
		font-size: 0.82rem;
		transition: opacity 0.2s, transform 0.2s;
		border: none;
		cursor: pointer;
	}

	.book-btn:hover {
		opacity: 0.9;
		transform: scale(1.02);
	}

	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		border: none;
		cursor: pointer;
		z-index: 2;
	}
	.prev {
		left: -15px;
	}
	.next {
		right: -15px;
	}

	@media (max-width: 768px) {
		.nav-btn {
			display: none;
		}
		.staff-card {
			flex: 0 0 190px;
		}
	}
</style>

