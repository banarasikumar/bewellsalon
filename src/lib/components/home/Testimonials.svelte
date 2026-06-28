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

	<div class="review-action-container">
		<a
			href="https://www.google.com/maps/search/?api=1&query=Bewell+Family+Salon+Tattoos+Bhandup+West+Mumbai"
			target="_blank"
			rel="noopener noreferrer"
			class="leave-review-btn"
		>
			<svg viewBox="0 0 24 24" width="24" height="24" class="google-icon">
				<path
					fill="#4285F4"
					d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				/>
				<path
					fill="#34A853"
					d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				/>
				<path
					fill="#FBBC05"
					d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
				/>
				<path
					fill="#EA4335"
					d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
				/>
			</svg>
			<span class="btn-text">Leave a Google Review</span>
		</a>
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

	.review-action-container {
		text-align: center;
		margin-top: 40px;
	}

	.leave-review-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		background: #ffffff;
		color: #3c4043;
		font-weight: 600;
		font-family: var(--font-body, sans-serif);
		padding: 14px 28px;
		border-radius: 50px;
		text-decoration: none;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		border: 1px solid #e8eaed;
	}

	.leave-review-btn:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
		background: #f8f9fa;
	}

	.leave-review-btn .btn-text {
		font-size: 1rem;
		letter-spacing: 0.3px;
	}
</style>
