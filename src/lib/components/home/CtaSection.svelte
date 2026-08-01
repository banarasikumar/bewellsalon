<section class="cta-section">
	<div class="cta-glow-bg"></div>
	<div class="container relative">
		<div class="cta-content">
			<span class="badge">✨ Book Today</span>
			<h2 class="title">Ready to <span class="highlight">Transform</span> Your Look?</h2>
			<p class="subtitle">
				Experience the luxury of premium beauty care. Your transformation awaits.
			</p>

			<div class="buttons">
				<a href="tel:+918928390360" class="btn primary">
					<span>📞</span>
					<span class="btn-text-col">
						<span class="btn-label">Call Now</span>
						<span class="btn-phone">+91 89283 90360</span>
					</span>
				</a>
				<a href="https://wa.me/918928390360" target="_blank" class="btn secondary">
					<span>💬</span> WhatsApp
				</a>
			</div>

			<p class="response-time">⚡ We respond within 5 minutes</p>
		</div>
	</div>
</section>

<style>
	.cta-section {
		position: relative;
		padding: 80px 20px;
		margin-top: 40px;
		overflow: hidden;
		text-align: center;
	}

	.cta-glow-bg {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at center, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
		z-index: 0;
	}

	.relative {
		position: relative;
		z-index: 1;
	}

	.badge {
		display: inline-block;
		background: var(--color-surface, rgba(255, 255, 255, 0.1));
		padding: 6px 16px;
		border-radius: var(--radius-full);
		font-size: 0.9rem;
		color: var(--color-accent-gold);
		margin-bottom: 20px;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
	}

	.title {
		font-size: 2.5rem;
		margin-bottom: 15px;
		color: var(--color-text-primary);
	}

	.highlight {
		color: var(--color-accent-gold);
		font-style: italic;
	}

	.subtitle {
		color: var(--color-text-secondary);
		font-size: 1.1rem;
		margin-bottom: 30px;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.buttons {
		display: flex;
		justify-content: center;
		gap: 15px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 16px 32px;
		border-radius: var(--radius-full);
		font-weight: 600;
		text-decoration: none;
		font-size: 1rem;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.btn:hover {
		transform: translateY(-3px);
	}

	.btn.primary {
		background: var(--gradient-gold);
		color: black;
		box-shadow: var(--shadow-gold);
	}

	/* Phone number column layout inside Call Now button */
	.btn-text-col {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		line-height: 1.2;
	}

	.btn-label {
		font-size: 1rem;
		font-weight: 700;
	}

	.btn-phone {
		font-size: 0.75rem;
		font-weight: 500;
		opacity: 0.8;
	}

	.btn.secondary {
		background: var(--color-surface, rgba(255, 255, 255, 0.1));
		border: 1px solid var(--color-border-strong, rgba(255, 255, 255, 0.2));
		color: var(--color-text-primary);
		backdrop-filter: blur(5px);
	}

	.btn.secondary:hover {
		background: var(--color-surface-hover, rgba(255, 255, 255, 0.2));
		border-color: var(--color-border-hover, rgba(255, 255, 255, 0.3));
	}

	.response-time {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		opacity: 0.8;
	}
</style>
