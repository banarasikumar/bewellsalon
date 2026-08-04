<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { db } from '$lib/firebase';
	import {
		doc,
		getDoc,
		addDoc,
		updateDoc,
		collection,
		serverTimestamp,
		query,
		orderBy,
		getDocs
	} from 'firebase/firestore';
	import { showToast } from '$lib/stores/toast';
	import { onMount } from 'svelte';
	import { ArrowLeft, Upload, Save } from 'lucide-svelte';
	import Loader from '$lib/components/ui/Loader.svelte';
	import { uploadStore } from '$lib/stores/uploadStore';
	import { allServices } from '$lib/stores/adminData';
	import { get } from 'svelte/store';
	import Cropper from 'svelte-easy-crop';
	import getCroppedImg from '$lib/utils/cropImage';

	let isEditing = $state(false);
	let loading = $state(false);
	let uploading = $state(false);
	let serviceId = $state<string | null>(null);

	// Form Data
	let name = $state('');
	let category = $state('Hair');
	let price = $state('');
	let originalPrice = $state('');
	let duration = $state('30');
	let description = $state('');
	let imageFile = $state<File | null>(null);
	let imagePreview = $state<string | null>(null);
	let currentImageUrl = $state<string | null>(null);

	// Crop state
	let showCropModal = $state(false);
	let crop = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let cropSrc = $state<string | null>(null);
	let pixelCrop = $state<any>(null);

	let categories = $state<string[]>(['Hair', 'Nails', 'Skin', 'Massage', 'Makeup', 'Other']);

	onMount(async () => {
		// Load Categories
		try {
			const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
			const snap = await getDocs(q);
			if (!snap.empty) {
				categories = snap.docs.map((d) => d.data().name);
			}
		} catch (error) {
			console.error('Error loading categories:', error);
		}

		const id = page.url.searchParams.get('id');
		if (id) {
			isEditing = true;
			serviceId = id;
			await loadService(id);
		}
	});

	async function loadService(id: string) {
		loading = true;
		try {
			// First try to read from the allServices store (populated by real-time listener)
			const storeServices = get(allServices);
			const storeService = storeServices.find((s) => s.id === id);

			if (storeService) {
				name = storeService.name;
				category = storeService.category;
				price = storeService.price.toString();
				originalPrice = storeService.originalPrice ? storeService.originalPrice.toString() : '';
				duration = storeService.duration.toString();
				description = storeService.description || '';
				currentImageUrl = storeService.image || null;
			} else {
				// Fallback to direct Firestore fetch if store isn't populated yet
				const snap = await getDoc(doc(db, 'services', id));
				if (snap.exists()) {
					const data = snap.data();
					name = data.name;
					category = data.category;
					price = data.price.toString();
					originalPrice = data.originalPrice ? data.originalPrice.toString() : '';
					duration = data.duration.toString();
					description = data.description || '';
					currentImageUrl = data.image || null;
				} else {
					showToast('Service not found', 'error');
					goto('/admin/services');
				}
			}
		} catch (error) {
			console.error('Error loading service:', error);
			showToast('Failed to load service', 'error');
		} finally {
			loading = false;
		}
	}

	function handleImageSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			const url = URL.createObjectURL(file);
			const img = new Image();
			img.onload = () => {
				if (img.width < 512 || img.height < 512) {
					showToast('Image dimensions must be at least 512x512 pixels', 'error');
					URL.revokeObjectURL(url);
					input.value = ''; // Reset input
					return;
				}
				cropSrc = url;
				showCropModal = true;
				// Clean up input value so the same file can be selected again if needed
				input.value = '';
			};
			img.src = url;
		}
	}

	async function handleCropDone() {
		if (!cropSrc) {
			showToast('No image source found', 'error');
			return;
		}
		if (!pixelCrop) {
			showToast('Please touch or move the image slightly to confirm crop area', 'error');
			return;
		}
		try {
			uploading = true;
			const croppedBlob = await getCroppedImg(cropSrc, pixelCrop, 1024, 1024);
			const ext = 'webp';
			const safeName = name.trim().replace(/\s+/g, '_') || 'service';
			const fileName = `${safeName}_crop_${Date.now()}.${ext}`;
			imageFile = new File([croppedBlob], fileName, { type: 'image/webp' });
			imagePreview = URL.createObjectURL(imageFile);

			showCropModal = false;
			cropSrc = null;
			pixelCrop = null;
		} catch (e) {
			console.error('Cropping error:', e);
			showToast('Failed to crop image', 'error');
		} finally {
			uploading = false;
		}
	}

	async function saveService() {
		if (!name || !price || !duration) {
			showToast('Please fill in all required fields', 'error');
			return;
		}

		uploading = true;
		try {
			let imageUrl = currentImageUrl;
			let needsBackgroundUpload = false;

			if (imageFile) {
				needsBackgroundUpload = true;
				// Leave imageUrl as currentImageUrl for now or null
			}

			const serviceData = {
				name,
				category,
				price: parseFloat(price),
				originalPrice: originalPrice ? parseFloat(originalPrice) : null,
				duration: parseInt(duration),
				description,
				image: imageUrl,
				updatedAt: new Date().toISOString()
			};

			let docRefPath = '';

			if (isEditing && serviceId) {
				await updateDoc(doc(db, 'services', serviceId), serviceData);
				docRefPath = `services/${serviceId}`;
				showToast('Service updated successfully', 'success');
			} else {
				const hasImage = !!imageUrl || needsBackgroundUpload;
				const docRef = await addDoc(collection(db, 'services'), {
					...serviceData,
					isActive: hasImage, // Active if background upload is starting or image exists
					createdAt: serverTimestamp() // Use server timestamp for new docs
				});
				docRefPath = `services/${docRef.id}`;
				if (hasImage) {
					showToast('Service created successfully', 'success');
				} else {
					showToast('Service saved as disabled (no image)', 'success');
				}
			}

			if (needsBackgroundUpload && imageFile) {
				const storagePath = `services/${imageFile.name}`;
				uploadStore.addUpload(imageFile, storagePath, docRefPath, 'image');
				showToast('Image uploading in background...', 'success');
			}

			goto('/admin/services');
		} catch (error) {
			console.error('Error saving service:', error);
			showToast('Failed to save service', 'error');
		} finally {
			uploading = false;
		}
	}
</script>

<div class="admin-view-header">
	<div style="display: flex; align-items: center; gap: 12px;">
		<button class="admin-back-btn" onclick={() => goto('/admin/services')}>
			<ArrowLeft size={20} />
		</button>
		<h2 class="admin-view-title">{isEditing ? 'Edit Service' : 'New Service'}</h2>
	</div>
</div>

<div class="admin-form-container">
	{#if loading}
		<div class="admin-loading-state">
			<Loader size={120} />
		</div>
	{:else}
		<div class="admin-form-section">
			<span class="admin-label">Service Image</span>

			<label class="admin-image-upload">
				{#if imagePreview || currentImageUrl}
					<img src={imagePreview || currentImageUrl} alt="Preview" class="admin-image-preview" />
					<div class="admin-image-overlay">
						<Upload size={20} />
						<span>Change</span>
					</div>
				{:else}
					<div class="admin-image-placeholder">
						<Upload size={24} color="var(--admin-text-tertiary)" />
						<span>Upload Image</span>
					</div>
				{/if}
				<input type="file" accept="image/*" onchange={handleImageSelect} style="display: none;" />
			</label>
		</div>

		<!-- Details -->
		<div class="admin-form-section">
			<label class="admin-label">
				Service Name
				<input
					type="text"
					bind:value={name}
					class="admin-input"
					placeholder="e.g. Luxury Haircut"
				/>
			</label>

			<div class="admin-grid-2">
				<label class="admin-label">
					Category
					<select bind:value={category} class="admin-select">
						{#each categories as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
				</label>

				<label class="admin-label">
					Price (₹)
					<input
						type="number"
						bind:value={price}
						class="admin-input"
						placeholder="0.00"
						step="0.01"
					/>
				</label>
			</div>

			<label class="admin-label">
				Original Price (₹) <span style="font-weight: 400; color: var(--admin-text-tertiary);"
					>(Optional, for offer display)</span
				>
				<input
					type="number"
					bind:value={originalPrice}
					class="admin-input"
					placeholder="0.00"
					step="0.01"
				/>
			</label>

			<label class="admin-label">
				Duration (minutes)
				<div class="admin-duration-selector">
					{#each ['15', '30', '45', '60', '90', '120'] as dur}
						<button
							class="admin-duration-chip"
							class:selected={duration === dur}
							onclick={() => (duration = dur)}
						>
							{dur}m
						</button>
					{/each}
					<input
						type="number"
						bind:value={duration}
						class="admin-input-small"
						placeholder="Custom"
					/>
				</div>
			</label>

			<label class="admin-label">
				Description (Optional)
				<textarea
					bind:value={description}
					class="admin-textarea"
					placeholder="Describe the service details..."
					rows="3"
				></textarea>
			</label>
		</div>
	{/if}
</div>

<!-- Bottom Action Bar -->
<div class="admin-bottom-bar">
	<button class="admin-btn-secondary" onclick={() => goto('/admin/services')}>Cancel</button>
	<button class="admin-btn-primary" onclick={saveService} disabled={uploading || loading}>
		{#if uploading}
			<div
				style="width: 24px; height: 24px; margin-right: 8px; display: flex; align-items: center; justify-content: center;"
			>
				<Loader size={36} fullPage={false} message="" height="24px" />
			</div>
			Saving...
		{:else}
			<Save size={18} />
			{isEditing ? 'Save Changes' : 'Create Service'}
		{/if}
	</button>
</div>

<!-- Crop Modal -->
{#if showCropModal && cropSrc}
	<div class="admin-crop-modal">
		<div class="admin-crop-modal-content">
			<div class="admin-crop-header">
				<h3>Crop Image</h3>
				<span class="admin-crop-subtitle">Minimum size 512x512, will be resized to 1024x1024</span>
			</div>
			
			<div class="admin-crop-container">
				<Cropper
					image={cropSrc}
					bind:crop
					bind:zoom
					aspect={1}
					oncropcomplete={(e) => {
						pixelCrop = e.pixels;
					}}
				/>
			</div>

			<div class="admin-crop-controls">
				<span>Zoom</span>
				<input type="range" min="1" max="3" step="0.1" bind:value={zoom} />
			</div>

			<div class="admin-crop-actions">
				<button 
					class="admin-btn-secondary" 
					onclick={() => {
						showCropModal = false;
						cropSrc = null;
						pixelCrop = null;
					}}
				>
					Cancel
				</button>
				<button class="admin-btn-primary" onclick={handleCropDone} disabled={uploading}>
					{#if uploading}
						<div class="admin-spinner-small">
							<Loader size={18} />
						</div>
						Cropping...
					{:else}
						Done
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.admin-back-btn {
		background: none;
		border: none;
		color: var(--admin-text);
		cursor: pointer;
		display: flex;
		align-items: center;
		padding: 0;
	}

	.admin-form-container {
		padding-bottom: 100px;
	}

	.admin-form-section {
		background: var(--admin-surface);
		border-radius: 16px;
		padding: 16px;
		margin-bottom: 16px;
	}

	.admin-label {
		display: block;
		font-size: 13px;
		font-weight: 500;
		color: var(--admin-text-secondary);
		margin-bottom: 12px;
	}

	.admin-input,
	.admin-select,
	.admin-textarea {
		width: 100%;
		background: var(--admin-bg);
		border: 1px solid transparent;
		color: var(--admin-text);
		padding: 12px;
		border-radius: 12px;
		font-family: inherit;
		font-size: 15px;
		margin-top: 6px;
		transition: all 0.2s;
	}

	.admin-input:focus,
	.admin-select:focus,
	.admin-textarea:focus {
		border-color: var(--admin-accent);
		outline: none;
		background: var(--admin-bg-active);
	}

	.admin-grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	/* Image Upload */
	.admin-image-upload {
		width: 100%;
		height: 180px;
		background: var(--admin-bg);
		border-radius: 12px;
		display: block;
		overflow: hidden;
		position: relative;
		cursor: pointer;
		border: 2px dashed var(--admin-border);
	}

	.admin-image-preview {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.admin-image-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		color: var(--admin-text-tertiary);
		font-size: 13px;
	}

	.admin-image-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		color: white;
		font-size: 13px;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.admin-image-upload:hover .admin-image-overlay {
		opacity: 1;
	}

	/* Duration Chips */
	.admin-duration-selector {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 6px;
	}

	.admin-duration-chip {
		background: var(--admin-bg);
		border: 1px solid transparent;
		color: var(--admin-text-secondary);
		padding: 8px 12px;
		border-radius: 20px;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.admin-duration-chip.selected {
		background: var(--admin-accent-light);
		color: var(--admin-accent);
		border-color: var(--admin-accent);
		font-weight: 600;
	}

	.admin-input-small {
		width: 80px;
		background: var(--admin-bg);
		border: 1px solid transparent;
		color: var(--admin-text);
		padding: 8px 12px;
		border-radius: 12px;
		font-family: inherit;
		font-size: 13px;
	}

	/* Bottom Bar */
	.admin-bottom-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--admin-surface);
		padding: 16px 20px;
		padding-bottom: max(16px, env(safe-area-inset-bottom));
		display: flex;
		gap: 12px;
		border-top: 1px solid var(--admin-border);
		z-index: 200; /* Higher than AdminNav (100) */
	}

	@media (min-width: 768px) {
		.admin-bottom-bar {
			left: 250px; /* Sidebar width */
		}
	}

	.admin-btn-primary {
		flex: 2;
		height: 48px;
		border-radius: 14px;
		background: var(--admin-accent);
		color: #000;
		font-weight: 600;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		cursor: pointer;
	}

	.admin-btn-primary:active {
		transform: scale(0.98);
	}

	.admin-btn-secondary {
		flex: 1;
		height: 48px;
		border-radius: 14px;
		background: var(--admin-bg);
		color: var(--admin-text);
		font-weight: 600;
		border: none;
		cursor: pointer;
	}

	.admin-spinner {
		animation: spin 1s linear infinite;
	}

	.admin-spinner-small {
		width: 18px;
		height: 18px;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.admin-loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 300px;
		color: var(--admin-accent);
	}

	/* Crop Modal */
	.admin-crop-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}

	.admin-crop-modal-content {
		background: var(--admin-surface);
		width: 100%;
		max-width: 500px;
		border-radius: 16px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.admin-crop-header {
		padding: 16px 20px;
		border-bottom: 1px solid var(--admin-border);
	}

	.admin-crop-header h3 {
		margin: 0;
		font-size: 18px;
		color: var(--admin-text);
	}

	.admin-crop-subtitle {
		font-size: 12px;
		color: var(--admin-text-secondary);
		display: block;
		margin-top: 4px;
	}

	.admin-crop-container {
		position: relative;
		width: 100%;
		height: 400px;
		background: #000;
	}

	.admin-crop-controls {
		padding: 16px 20px;
		display: flex;
		align-items: center;
		gap: 16px;
		border-bottom: 1px solid var(--admin-border);
	}

	.admin-crop-controls span {
		font-size: 14px;
		font-weight: 500;
		color: var(--admin-text);
	}

	.admin-crop-controls input[type="range"] {
		flex: 1;
		accent-color: var(--admin-accent);
	}

	.admin-crop-actions {
		padding: 16px 20px;
		display: flex;
		gap: 12px;
	}
</style>
