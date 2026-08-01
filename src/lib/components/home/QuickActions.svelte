<script lang="ts">
	import { appSettings } from '$lib/stores/appSettings';
	
	interface Props {
		phoneNumber?: string;
		enabled?: boolean;
		isPreview?: boolean;
	}
	
	let { phoneNumber = undefined, enabled = undefined, isPreview = false }: Props = $props();
	
	let quickActionsEnabled = $derived(enabled !== undefined ? enabled : ($appSettings.quickActionsEnabled ?? true));
	let quickActionsPhoneNumber = $derived(phoneNumber !== undefined ? phoneNumber : ($appSettings.quickActionsPhoneNumber || '+918928390360'));
	
	// format phone number for tel: link (strip spaces)
	let rawPhoneNumber = $derived(quickActionsPhoneNumber.replace(/\s+/g, ''));
</script>

{#if quickActionsEnabled || isPreview}
<section class="quick-actions-section" class:preview-mode={isPreview} style={isPreview && !quickActionsEnabled ? 'opacity: 0.45; filter: grayscale(0.6);' : ''}>
	<div class="container">
		<!-- Phone Number Action -->
		<a href="tel:{rawPhoneNumber}" class="call-action-card">
			<div class="call-icon-wrapper">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path
						d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
					></path>
				</svg>
			</div>
			<div class="call-text">
				<span class="call-title">Call Us Now</span>
				<span class="phone-number">{quickActionsPhoneNumber}</span>
			</div>
			<div class="call-chevron">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="9 18 15 12 9 6"></polyline>
				</svg>
			</div>
		</a>

		<!-- Social Media Actions -->
		<div class="social-actions-grid">
			<a
				href="https://wa.me/{rawPhoneNumber.replace('+', '')}"
				target="_blank"
				rel="noopener noreferrer"
				class="social-btn whatsapp"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path
						d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
					></path>
				</svg>
				<span>WhatsApp</span>
			</a>
			<a
				href="https://instagram.com"
				target="_blank"
				rel="noopener noreferrer"
				class="social-btn instagram"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
					<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
					<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
				</svg>
				<span>Instagram</span>
			</a>
			<a
				href="https://facebook.com"
				target="_blank"
				rel="noopener noreferrer"
				class="social-btn facebook"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
				</svg>
				<span>Facebook</span>
			</a>
		</div>
	</div>
</section>
{/if}

<style>
	.quick-actions-section {
		padding: 20px 0;
		background: transparent;
	}

	.quick-actions-section.preview-mode {
		padding: 0;
		width: 100%;
	}

	.quick-actions-section.preview-mode .container {
		padding: 0;
		gap: 10px;
	}

	.quick-actions-section.preview-mode .call-action-card {
		padding: 12px 14px;
		border-radius: 12px;
	}

	.quick-actions-section.preview-mode .call-icon-wrapper {
		width: 38px;
		height: 38px;
		margin-right: 10px;
	}

	.quick-actions-section.preview-mode .phone-number {
		font-size: 1.15rem;
	}

	.quick-actions-section.preview-mode .social-actions-grid {
		gap: 8px;
	}

	.quick-actions-section.preview-mode .social-btn {
		padding: 10px 4px;
		border-radius: 10px;
		font-size: 0.75rem;
		gap: 4px;
	}

	.quick-actions-section.preview-mode .social-btn svg {
		width: 18px;
		height: 18px;
	}

	.container {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 0 16px;
	}

	/* Call Action Card */
	.call-action-card {
		display: flex;
		align-items: center;
		padding: 16px 20px;
		background: #111116;
		border-radius: 16px;
		border: 1px solid rgba(212, 175, 55, 0.3);
		text-decoration: none;
		color: #ffffff;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1);
	}

	.call-action-card:hover {
		transform: translateY(-2px);
		border-color: #d4af37;
		box-shadow: 0 12px 30px -4px rgba(212, 175, 55, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2);
		background: #16161d;
	}

	.call-icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		background: rgba(212, 175, 55, 0.12);
		border: 1px solid rgba(212, 175, 55, 0.3);
		border-radius: 50%;
		color: #d4af37;
		margin-right: 16px;
		transition: all 0.3s ease;
	}

	.call-action-card:hover .call-icon-wrapper {
		background: #d4af37;
		color: #000000;
		box-shadow: 0 0 15px rgba(212, 175, 55, 0.6);
	}

	.call-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.call-title {
		font-size: 0.75rem;
		color: #d4af37;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1.2px;
	}

	.phone-number {
		font-size: 1.45rem;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: 0.75px;
	}

	.call-chevron {
		color: #d4af37;
		opacity: 0.8;
		transition: transform 0.3s ease;
	}

	.call-action-card:hover .call-chevron {
		opacity: 1;
		transform: translateX(5px);
	}

	/* Social Actions Grid */
	.social-actions-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}

	.social-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 16px 12px;
		background: #111116;
		border-radius: 14px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		text-decoration: none;
		color: #e2e8f0;
		transition: all 0.3s ease;
		font-size: 0.85rem;
		font-weight: 600;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
	}

	.social-btn:hover {
		transform: translateY(-3px);
		color: #ffffff;
	}

	.social-btn svg {
		transition: all 0.3s ease;
	}

	.social-btn.whatsapp {
		border-color: rgba(37, 211, 102, 0.25);
	}

	.social-btn.whatsapp svg {
		color: #25d366;
	}

	.social-btn.whatsapp:hover {
		background: rgba(37, 211, 102, 0.15);
		border-color: #25d366;
		color: #25d366;
		box-shadow: 0 8px 20px rgba(37, 211, 102, 0.25);
	}

	.social-btn.instagram {
		border-color: rgba(225, 48, 108, 0.25);
	}

	.social-btn.instagram svg {
		color: #e1306c;
	}

	.social-btn.instagram:hover {
		background: rgba(225, 48, 108, 0.15);
		border-color: #e1306c;
		color: #e1306c;
		box-shadow: 0 8px 20px rgba(225, 48, 108, 0.25);
	}

	.social-btn.facebook {
		border-color: rgba(24, 119, 242, 0.25);
	}

	.social-btn.facebook svg {
		color: #1877f2;
	}

	.social-btn.facebook:hover {
		background: rgba(24, 119, 242, 0.15);
		border-color: #1877f2;
		color: #1877f2;
		box-shadow: 0 8px 20px rgba(24, 119, 242, 0.25);
	}
</style>
