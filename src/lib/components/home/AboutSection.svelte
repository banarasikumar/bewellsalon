<script lang="ts">
</script>

<section class="about-section container section-padding" id="about">
	<div class="section-header">
		<h2 class="section-title">
			<span class="title-decoration">✨</span>
			About Bewell
			<span class="title-decoration">✨</span>
		</h2>
		<p class="section-subtitle">Where Beauty Meets Excellence</p>
	</div>

	<!-- Premium Badge -->
	<div class="premium-badge">
		<span class="badge-icon">⭐</span>
		<span class="badge-text">Bhandup's Top-Rated Salon & Tattoo Studio (4.8 Stars)</span>
	</div>

	<div class="cards-grid">
		<!-- Story Card -->
		<div class="info-card">
			<div class="card-icon">🏆</div>
			<h3>Our Story</h3>
			<p>
				<span class="highlight-gold">Bewell Family Salon & Tattoos</span> is
				<span class="highlight-shimmer">Bhandup West's most welcoming neighborhood spot</span>.
				Backed by 231+ reviews, we combine a <span class="highlight-white">relaxed atmosphere</span>
				with high hygiene standards, professional expertise, and incredible value for money.
			</p>
		</div>

		<!-- Promise Card -->
		<div class="info-card">
			<div class="card-icon">💎</div>
			<h3>Our Promise</h3>
			<p>
				We promise exceptional service with <span class="highlight-shimmer">minimal wait times</span>.
				Whether you're here for a haircut, spa day, or a new tattoo, our attentive staff ensures you're
				<span class="highlight-white">never disappointed</span>. Enjoy our <span class="highlight-gold">pocket-friendly luxury</span> and leave feeling your best.
			</p>
		</div>
	</div>

	<div class="highlights-pills">
		<div class="pill premium">
			<span>🥇</span> Top Rated in Bhandup West
		</div>
		<div class="pill">
			<span>👩‍🎨</span> Expert Stylists
		</div>
		<div class="pill">
			<span>💫</span> Luxury Products
		</div>
		<div class="pill">
			<span>🎯</span> VIP Experience
		</div>
	</div>

	<div class="address-container">
		<div class="address-card">
			<div class="address-icon">📍</div>
			<address>
				<strong>Bewell Family Salon</strong><br />
				Shop 2/3, Master Niwas, Quarry Rd,<br />near Mangatram petrol pump, Ganesh Nagar, Bhandup West, Mumbai, Maharashtra 400078
			</address>
		</div>

		<div class="map-wrapper">
			<iframe
				title="Bewell Family Salon Location Map"
				src="https://maps.google.com/maps?q=Bewell%20Family%20Salon%20Tattoos%2C%20Bhandup%20West%2C%20Mumbai&t=&z=17&ie=UTF8&iwloc=B&output=embed"
				width="100%"
				height="260"
				style="border:0; border-radius: 16px;"
				allowfullscreen
				loading="lazy"
			></iframe>
			<div class="map-action">
				<a
					href="https://maps.app.goo.gl/eFfiqqZ46m4HrXCy6"
					target="_blank"
					rel="noopener noreferrer"
					class="get-directions-btn"
				>
					Get Directions
				</a>
			</div>
		</div>
	</div>
</section>

<style>
	.section-padding {
		padding-top: 60px;
		padding-bottom: 60px;
	}
	.section-header {
		text-align: center;
		margin-bottom: 30px;
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

	.premium-badge {
		background: linear-gradient(90deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.2));
		border: 1px solid var(--color-accent-gold);
		border-radius: var(--radius-full);
		padding: 10px 20px;
		text-align: center;
		margin: 0 auto 40px;
		max-width: 600px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		font-weight: 600;
		color: var(--color-accent-gold);
		font-size: 0.9rem;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
		margin-bottom: 40px;
	}

	.info-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: var(--radius-lg);
		padding: 30px;
		text-align: center;
		backdrop-filter: blur(10px);
	}

	.card-icon {
		font-size: 3rem;
		margin-bottom: 20px;
	}

	.info-card h3 {
		font-size: 1.5rem;
		margin-bottom: 15px;
		color: var(--color-text-primary);
	}

	.info-card p {
		color: var(--color-text-secondary);
		line-height: 1.6;
	}

	.highlight-gold {
		color: var(--color-accent-gold);
		font-weight: 600;
	}
	.highlight-white {
		color: white;
		font-weight: 600;
	}
	.highlight-shimmer {
		background: linear-gradient(90deg, #fff, #999, #fff);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		font-weight: 700;
		background-size: 200% auto;
		animation: shimmer 3s linear infinite;
	}

	@keyframes shimmer {
		to {
			background-position: 200% center;
		}
	}

	.highlights-pills {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 12px;
		margin-bottom: 40px;
	}

	.pill {
		background: rgba(255, 255, 255, 0.05);
		border-radius: var(--radius-full);
		padding: 8px 16px;
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--color-text-primary);
		font-size: 0.9rem;
	}

	.pill.premium {
		background: rgba(212, 175, 55, 0.1);
		border: 1px solid rgba(212, 175, 55, 0.3);
		color: var(--color-accent-gold);
	}

	.address-container {
		max-width: 600px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.address-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: var(--radius-md);
		padding: 20px;
		display: flex;
		align-items: center;
		gap: 15px;
		width: 100%;
	}

	.address-icon {
		font-size: 2rem;
	}

	address {
		font-style: normal;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		line-height: 1.5;
	}

	address strong {
		color: var(--color-text-primary);
		display: block;
		margin-bottom: 4px;
	}

	.map-wrapper {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 20px;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.map-action {
		display: flex;
		justify-content: flex-end;
	}

	.get-directions-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--color-accent-gold) 0%, #b89628 100%);
		color: #000;
		font-weight: 700;
		font-size: 0.88rem;
		padding: 10px 20px;
		border-radius: 12px;
		text-decoration: none;
		transition: all 0.2s ease;
		box-shadow: 0 2px 6px rgba(212, 175, 55, 0.12);
	}

	.get-directions-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 3px 10px rgba(212, 175, 55, 0.2);
		color: #000;
	}
</style>
