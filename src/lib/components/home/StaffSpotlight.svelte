<script lang="ts">
	import imgPriya from '$lib/assets/stock/professional_beauty__59c2cb84.jpg';
	import imgMeera from '$lib/assets/stock/professional_beauty__30f1cabb.jpg';
	import imgAnjali from '$lib/assets/stock/professional_beauty__4b0e7940.jpg';
	import imgRiya from '$lib/assets/stock/professional_beauty__bd79d0cb.jpg';

	const staff = [
		{
			name: 'Priya Sharma',
			role: 'Senior Hair Stylist',
			rating: '4.9',
			exp: '12+ Years Experience',
			specialties: ['Hair Coloring', 'Balayage', 'Bridal Hair'],
			img: imgPriya
		},
		{
			name: 'Meera Patel',
			role: 'Makeup Artist',
			rating: '4.8',
			exp: '8+ Years Experience',
			specialties: ['Bridal Makeup', 'HD Makeup', 'Party Looks'],
			img: imgMeera
		},
		{
			name: 'Anjali Singh',
			role: 'Skin Care Specialist',
			rating: '4.9',
			exp: '10+ Years Experience',
			specialties: ['Facials', 'Skin Treatments', 'Anti-Aging'],
			img: imgAnjali
		},
		{
			name: 'Riya Gupta',
			role: 'Nail Art Expert',
			rating: '4.7',
			exp: '6+ Years Experience',
			specialties: ['Gel Nails', 'Nail Art', 'Extensions'],
			img: imgRiya
		}
	];

	let scrollContainer: HTMLElement;

	const scroll = (direction: number) => {
		if (scrollContainer) {
			const scrollAmount = 300;
			scrollContainer.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
		}
	};
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

	<div class="carousel-wrapper">
		<button class="nav-btn prev" on:click={() => scroll(-1)}>❮</button>

		<div class="staff-carousel" bind:this={scrollContainer}>
			{#each staff as member}
				<div class="staff-card">
					<div class="photo-wrapper">
						<img src={member.img} alt={member.name} loading="lazy" />
					</div>
					<div class="info">
						<div class="name-row">
							<h3>{member.name}</h3>
							<div class="rating">⭐ {member.rating}</div>
						</div>
						<p class="role">{member.role}</p>
						<div class="exp-badge">{member.exp}</div>
						<div class="tags">
							{#each member.specialties as tag}
								<span class="tag">{tag}</span>
							{/each}
						</div>
						<a
							href="https://wa.me/918928390360?text=Hi%2C%20I%20want%20to%20book%20with%20{member.name}"
							target="_blank"
							class="book-btn">Book with {member.name.split(' ')[0]}</a
						>
					</div>
				</div>
			{/each}
		</div>

		<button class="nav-btn next" on:click={() => scroll(1)}>❯</button>
	</div>
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
		border: 1px solid rgba(255, 255, 255, 0.05);
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

	.rating {
		font-size: 0.9rem;
		color: #ffd700;
	}

	.role {
		color: var(--color-accent-gold);
		font-size: 0.9rem;
		margin-bottom: 12px;
	}

	.exp-badge {
		display: inline-block;
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text-secondary);
		font-size: 0.75rem;
		padding: 4px 8px;
		border-radius: 4px;
		margin-bottom: 12px;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 20px;
	}

	.tag {
		background: rgba(212, 175, 55, 0.1);
		color: var(--color-accent-gold);
		font-size: 0.7rem;
		padding: 3px 8px;
		border-radius: var(--radius-full);
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
