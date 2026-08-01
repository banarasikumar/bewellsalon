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
				<a href="/#about">Home</a>
				<a href="/#special-offers">Offers</a>
				<a href="/services">Services</a>
				<a href="/#reviews">Reviews</a>
			</nav>
		</div>

		<div class="social-column">
			<h4>Follow Us</h4>
			<div class="social-icons">
				<a
					href="https://www.youtube.com/@bewellfamilysalon_tattoos"
					target="_blank"
					rel="noopener noreferrer"
					class="social-icon youtube"
					aria-label="YouTube"
				>
					<svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
						<path
							d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
						/>
					</svg>
				</a>
				<a
					href="https://www.instagram.com/bewellfamilysalon_tattoos"
					target="_blank"
					rel="noopener noreferrer"
					class="social-icon instagram"
					aria-label="Instagram"
				>
					<svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
						<path
							d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"
						/>
					</svg>
				</a>
				<a
					href="https://www.facebook.com/bewellfamilysalon/"
					target="_blank"
					rel="noopener noreferrer"
					class="social-icon facebook"
					aria-label="Facebook"
				>
					<svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
						<path
							d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
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
		padding: 48px 20px 24px;
		margin-top: 40px;
		border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.05));
		text-align: center;
	}

	.footer-content {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 36px;
		margin-bottom: 36px;
	}

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
		font-size: 1.8rem;
		margin-bottom: 6px;
	}

	.footer-tagline {
		color: var(--color-text-secondary);
		font-size: 1.05rem;
	}

	h4 {
		color: var(--color-text-primary);
		margin-bottom: 16px;
		font-size: 1.2rem;
		letter-spacing: 0.5px;
		text-transform: uppercase;
	}

	.footer-nav {
		display: flex;
		flex-direction: column;
		gap: 10px;
		align-items: center;
	}

	.footer-nav a {
		color: var(--color-text-secondary);
		text-decoration: none;
		font-size: 1.05rem;
		transition: color 0.2s;
	}

	.footer-nav a:hover {
		color: var(--color-accent-gold);
	}

	.social-icons {
		display: flex;
		gap: 18px;
		justify-content: center;
	}

	.social-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 12px;
		transition:
			transform 0.25s ease,
			box-shadow 0.25s ease,
			background 0.25s ease;
	}

	.social-icon:hover {
		transform: translateY(-4px);
	}

	/* YouTube — brand red */
	.social-icon.youtube {
		color: #ff0000;
		background: rgba(255, 0, 0, 0.1);
	}
	.social-icon.youtube:hover {
		background: rgba(255, 0, 0, 0.18);
		box-shadow: 0 6px 20px rgba(255, 0, 0, 0.25);
	}

	/* Instagram — gradient magenta/orange */
	.social-icon.instagram {
		color: #e1306c;
		background: rgba(225, 48, 108, 0.1);
	}
	.social-icon.instagram:hover {
		background: rgba(225, 48, 108, 0.18);
		box-shadow: 0 6px 20px rgba(225, 48, 108, 0.25);
	}

	/* Facebook — brand blue */
	.social-icon.facebook {
		color: #1877f2;
		background: rgba(24, 119, 242, 0.1);
	}
	.social-icon.facebook:hover {
		background: rgba(24, 119, 242, 0.18);
		box-shadow: 0 6px 20px rgba(24, 119, 242, 0.25);
	}

	.footer-bottom {
		text-align: center;
		padding-top: 24px;
		border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.05));
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}
</style>

