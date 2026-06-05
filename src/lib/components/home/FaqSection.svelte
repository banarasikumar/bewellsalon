<script lang="ts">
	import { slide } from 'svelte/transition';

	const faqs = [
		{
			q: 'What are your salon hours?',
			a: 'We are open from 9:00 AM to 11:00 PM everyday. We recommend booking an appointment in advance to ensure your preferred time slot is available.'
		},
		{
			q: 'How do I book an appointment?',
			a: 'You can book an appointment by calling us at +91 8928390360, +91 9702243497, messaging us on WhatsApp, or visiting our salon directly. We also accept walk-ins based on availability.'
		},
		{
			q: 'What products do you use?',
			a: 'We use only premium, professional-grade products from trusted international and Indian brands. Our products are carefully selected for quality, safety, and effectiveness.'
		},
		{
			q: 'Do you offer bridal packages?',
			a: 'Yes! We offer comprehensive bridal packages that include pre-bridal treatments, makeup, hair styling, and more. Contact us for a personalized consultation and package details.'
		},
		{
			q: 'What is your cancellation policy?',
			a: 'We request at least 2 hours notice for cancellations. This helps us accommodate other clients and maintain our service quality. For bridal appointments, please provide 24 hours notice.'
		},
		{
			q: 'Do you offer services for men?',
			a: 'Absolutely! Bewell is a family salon that caters to men, women, and children. We offer a full range of grooming services for men including haircuts, beard styling, facials, and more.'
		}
	];

	let openIndex: number | null = null;

	const toggle = (index: number) => {
		openIndex = openIndex === index ? null : index;
	};
</script>

<section class="faq-section container section-padding" id="faq">
	<div class="section-header">
		<h2 class="section-title">
			<span class="title-decoration">❓</span>
			Frequently Asked Questions
			<span class="title-decoration">💬</span>
		</h2>
		<p class="section-subtitle">Everything you need to know about our services</p>
	</div>

	<div class="faq-grid">
		{#each faqs as faq, i}
			<div class="faq-item" class:active={openIndex === i}>
				<button class="faq-question" on:click={() => toggle(i)}>
					<h3>{faq.q}</h3>
					<span class="icon">{openIndex === i ? '−' : '+'}</span>
				</button>
				{#if openIndex === i}
					<div class="faq-answer" transition:slide>
						<div class="answer-content">
							<p>{faq.a}</p>
						</div>
					</div>
				{/if}
			</div>
		{/each}
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

	.faq-grid {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.faq-item {
		background: var(--color-bg-secondary);
		border-radius: var(--radius-md);
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.05);
		transition: border-color 0.3s;
	}

	.faq-item.active {
		border-color: var(--color-accent-gold);
	}

	.faq-question {
		width: 100%;
		text-align: left;
		padding: 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: transparent;
		color: var(--color-text-primary);
	}

	.faq-question h3 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
	}

	.icon {
		font-size: 1.5rem;
		color: var(--color-accent-gold);
		margin-left: 15px;
	}

	.faq-answer {
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.answer-content {
		padding: 20px;
		color: var(--color-text-secondary);
		line-height: 1.6;
		font-size: 0.95rem;
	}
</style>
