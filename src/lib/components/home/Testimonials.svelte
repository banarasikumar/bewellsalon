<script lang="ts">
	const testimonials = [
		{
			stars: '⭐⭐⭐⭐⭐',
			text: 'Best experience ever at Dwell Family Salon & Tattoo! I recently visited Dwell Family Salon & Tattoo, and I must say it was one of the...',
			author: 'Dnyrajit Yadav',
			label: '7 months ago'
		},
		{
			stars: '⭐⭐⭐⭐⭐',
			text: 'I recently visited this salon for a full hair colour and was very impressed with the service. The stylist named Rahul knew exactly what I wanted, suggested a few options without pushing anything, and delivered...',
			author: 'Archi Gancer',
			label: '7 months ago'
		},
		{
			stars: '⭐⭐⭐⭐⭐',
			text: 'Customer care were greetings, minimal wait times and are smooth with personalized consultation on hair.',
			author: 'Shakir Ansari',
			label: '8 months ago'
		},
		{
			stars: '⭐⭐⭐⭐⭐',
			text: 'Good salon, friendly and professional staff. Hygienic, beautiful, and they offer excellent haircuts, facials, and make-up.',
			author: 'Hilary Ghosh',
			label: '8 months ago'
		},
		{
			stars: '⭐⭐⭐⭐⭐',
			text: 'The many people in the salon were very helpful. I chose it based on their social media page. I wanted a hair treatment and hair colour done. When I arrived at the salon at 2 PM, the staff was so...',
			author: 'AARTI LAMOTI',
			label: '3 years ago'
		},
		{
			stars: '⭐⭐⭐⭐⭐',
			text: 'Awesome experience. Staff is very friendly and every one takes care to make you feel at home. Services...',
			author: 'Name partially unreadable',
			label: '8 months ago'
		},
		{
			stars: '⭐⭐⭐⭐⭐',
			text: 'Jassi and Vandna have a very friendly nature and their clients very well, and I like to talk about the staff they are also very good.',
			author: 'Shikha Upadhyay',
			label: '5 months ago'
		},
		{
			stars: '⭐⭐⭐⭐⭐',
			text: 'I have done hydrafacial from Dwell, Ranchi. Recommended to all. Do visit here. Thank you for the great service.',
			author: 'Name partially unreadable',
			label: '2 years ago'
		},
		{
			stars: '⭐⭐⭐⭐⭐',
			text: 'Good behaved family salon providing decent services, while maintaining good levels of hygiene. The environment is relaxing and the staff are accommodating to specific questions and requests.',
			author: 'Fizam Ji',
			label: '5 years ago'
		},
		{
			stars: '⭐⭐⭐⭐⭐',
			text: 'Awesome Experience. worth every penny for trying this salon.',
			author: 'Aditi Prajapati',
			label: '8 months ago'
		},
		{
			stars: '⭐⭐⭐⭐⭐',
			text: 'Hi! a guy, must say I’m very glad and satisfied with the haircut. The haircut was as I wanted and the staff was polite.',
			author: 'Dhiraj Debnath',
			label: '3 years ago'
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

<section class="reviews-section container section-padding" id="reviews">
	<div class="section-header">
		<h2 class="section-title">
			<span class="title-decoration">⭐</span>
			Customer Testimonials
			<span class="title-decoration">⭐</span>
		</h2>
		<p class="section-subtitle">Hear from our satisfied clients</p>
	</div>

	<div class="carousel-wrapper">
		<button class="nav-btn prev" on:click={() => scroll(-1)}>❮</button>

		<div class="testimonial-carousel" bind:this={scrollContainer}>
			{#each testimonials as review}
				<div class="review-card">
					<div class="stars">{review.stars}</div>
					<p class="text">"{review.text}"</p>
					<div class="author-block">
						<strong>{review.author}</strong>
						<span class="label">{review.label}</span>
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

	.testimonial-carousel {
		display: flex;
		gap: 20px;
		overflow-x: auto;
		padding: 10px 0 20px 0;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
	}
	.testimonial-carousel::-webkit-scrollbar {
		display: none;
	}

	.review-card {
		flex: 0 0 300px;
		background: var(--color-bg-secondary);
		border-radius: var(--radius-lg);
		padding: 30px;
		position: relative;
		border: 1px solid rgba(255, 255, 255, 0.05);
		scroll-snap-align: center;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		backdrop-filter: blur(10px);
	}

	.stars {
		margin-bottom: 15px;
		font-size: 1.2rem;
	}

	.text {
		color: var(--color-text-primary);
		line-height: 1.6;
		font-style: italic;
		margin-bottom: 20px;
		flex-grow: 1;
	}

	.author-block {
		display: flex;
		flex-direction: column;
		padding-top: 15px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.author-block strong {
		color: var(--color-accent-gold);
		font-size: 1rem;
		margin-bottom: 4px;
	}
	.label {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
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
		.review-card {
			flex: 0 0 85%;
		}
	}
</style>
