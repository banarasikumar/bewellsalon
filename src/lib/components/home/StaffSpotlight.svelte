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
								onerror={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }}
							/>
							<div class="avatar-fallback" style={member.photoURL ? 'display:none;' : 'display:flex;'}>
								<span>{member.name.charAt(0).toUpperCase()}</span>
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
		flex: 0 0 280px;
		height: 380px;
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
		flex: 0 0 280px;
		background: var(--color-bg-secondary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.05));
		transition: transform 0.3s;
		scroll-snap-align: center;
	}

	.staff-card:hover {
		transform: translateY(-5px);
		box-shadow: var(--shadow-glass);
	}

	.photo-wrapper {
		height: 250px;
		overflow: hidden;
	}

	.photo-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s;
	}

	.staff-card:hover .photo-wrapper img {
		transform: scale(1.05);
	}

	/* Fallback avatar when no photo */
	.avatar-fallback {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
		border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.05));
	}

	.avatar-fallback span {
		font-size: 5rem;
		font-weight: 800;
		color: var(--color-accent-gold);
		opacity: 0.7;
		font-family: var(--font-heading);
		text-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
	}

	.info {
		padding: 20px;
	}

	.name-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
	}

	.name-row h3 {
		font-size: 1.1rem;
		color: var(--color-text-primary);
		margin: 0;
	}

	.role {
		color: var(--color-accent-gold);
		font-size: 0.9rem;
		margin-bottom: 12px;
	}

	.specialty-badge {
		display: inline-block;
		background: var(--color-surface, rgba(255, 255, 255, 0.1));
		color: var(--color-text-secondary);
		font-size: 0.75rem;
		padding: 4px 8px;
		border-radius: 4px;
		margin-bottom: 16px;
	}

	.book-btn {
		display: block;
		width: 100%;
		text-align: center;
		background: var(--color-accent-gold);
		color: black;
		padding: 10px;
		border-radius: var(--radius-full);
		text-decoration: none;
		font-weight: 600;
		font-size: 0.9rem;
		transition: opacity 0.2s;
		border: none;
		cursor: pointer;
	}

	.book-btn:hover {
		opacity: 0.9;
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
			flex: 0 0 85%;
		}
	}
</style>

