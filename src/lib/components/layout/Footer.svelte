<script lang="ts">
	const year = new Date().getFullYear();
</script>

<footer class="footer-section container">
	<div class="footer-content">
		<div class="brand-column">
			<h2 class="footer-logo">Bewell</h2>
			<p class="footer-tagline">Premium Family Salon</p>
		</div>

		<div class="links-column">
			<h4>Quick Links</h4>
			<nav class="footer-nav">
				<a href="#home">Home</a>
				<a href="#offers">Offers</a>
				<a href="#services">Services</a>
				<a href="#reviews">Reviews</a>
			</nav>
		</div>

		<div class="social-column">
			<h4>Follow Us</h4>
			<div class="social-icons">
				<a
					href="https://www.youtube.com/@bewellfamilysalon_tattoos"
					target="_blank"
					class="social-icon youtube"
					aria-label="YouTube"
				>
					<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
						<path
							d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"
						/>
					</svg>
				</a>
				<a
					href="https://www.instagram.com/bewellfamilysalon_tattoos"
					target="_blank"
					class="social-icon instagram"
					aria-label="Instagram"
				>
					<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
						<path
							d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
						/>
					</svg>
				</a>
				<a
					href="https://www.facebook.com/bewellfamilysalon/"
					target="_blank"
					class="social-icon facebook"
					aria-label="Facebook"
				>
					<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
						<path
							d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"
						/>
					</svg>
				</a>
			</div>
		</div>
	</div>

	<div class="footer-bottom">
		<p>&copy; Bewell {year}. All rights reserved.</p>
	</div>
</footer>

<style>
	.footer-section {
		background: var(--color-bg-secondary);
		padding: 40px 20px 20px;
		margin-top: 40px;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		text-align: center;
	}

	.footer-content {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 30px;
		margin-bottom: 30px;
	}

	/* Ensure columns align items to center in the grid cells if needed, 
       though text-align: center on parent handles text. 
       Flex containers need explicit centering. */
	.brand-column,
	.links-column,
	.social-column {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.footer-logo {
		font-family: var(--font-heading);
		color: var(--color-accent-gold);
		font-size: 1.5rem;
		margin-bottom: 5px;
	}

	.footer-tagline {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}

	h4 {
		color: var(--color-text-primary);
		margin-bottom: 15px;
		font-size: 1rem;
	}

	.footer-nav {
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: center;
	}

	.footer-nav a {
		color: var(--color-text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		transition: color 0.2s;
	}

	.footer-nav a:hover {
		color: var(--color-accent-gold);
	}

	.social-icons {
		display: flex;
		gap: 15px;
		justify-content: center;
	}

	.social-icon {
		color: var(--color-text-secondary);
		transition:
			transform 0.2s,
			color 0.2s;
	}

	.social-icon:hover {
		transform: translateY(-3px);
	}

	.social-icon.youtube:hover {
		color: #ff0000;
	}
	.social-icon.instagram:hover {
		color: #e1306c;
	}
	.social-icon.facebook:hover {
		color: #1877f2;
	}

	.footer-bottom {
		text-align: center;
		padding-top: 20px;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		color: var(--color-text-secondary);
		font-size: 0.8rem;
	}
</style>
