<script lang="ts">
	import { onMount } from 'svelte';
	import { appSettings, updateAppSetting, initAppSettingsListener } from '$lib/stores/appSettings';
	import { showToast } from '$lib/stores/toast';
	import { storage } from '$lib/firebase';
	import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
	import { fade, fly, slide } from 'svelte/transition';
	import {
		Save,
		Tag,
		RefreshCw,
		AlertCircle,
		Image as ImageIcon,
		Sparkles,
		TrendingUp,
		Plus,
		Trash2,
		Copy,
		ArrowUp,
		ArrowDown,
		Eye,
		Play,
		Tv,
		Zap,
		Layers,
		Search,
		ChevronDown,
		ChevronUp,
		Crop,
		RotateCcw,
		X,
		FileText,
		Download
	} from 'lucide-svelte';

	// Save States
	let savingAll = $state(false);
	let savingTicker = $state(false);
	let savingVideo = $state(false);
	let savingOffers = $state(false);
	let savingMenuImage = $state(false);
	let savingMenuPdf = $state(false);
	let savingCardIndex = $state<number | null>(null);

	// View Tabs: 'editor' or 'preview'
	let activeTab = $state<'editor' | 'preview'>('editor');

	// Collapsible Sections Accordion State (No section expanded by default; single section expanded at a time)
	let activeSection = $state<'marquee' | 'menu' | 'video' | 'offers' | null>(null);

	function toggleSection(section: 'marquee' | 'menu' | 'video' | 'offers') {
		if (activeSection === section) {
			activeSection = null;
		} else {
			activeSection = section;
		}
	}

	// Search & Category filter for cards
	let searchQuery = $state('');
	let categoryFilter = $state('ALL');

	// Local state copies
	let localTickerText = $state($appSettings.promoTickerText || '');
	let localTickerEnabled = $state($appSettings.promoTickerEnabled ?? true);
	let localTickerColor1 = $state($appSettings.promoTickerColor1 || '#9333ea');
	let localTickerColor2 = $state($appSettings.promoTickerColor2 || '#db2777');
	let localTickerHeight = $state($appSettings.promoTickerHeight || 40);
	let localVideoUrl = $state($appSettings.promoVideoUrl || '');
	let localVideoEnabled = $state($appSettings.promoVideoEnabled || false);
	let localMenuImageUrl = $state($appSettings.menuImageUrl || '');
	let localMenuImageEnabled = $state($appSettings.menuImageEnabled ?? true);
	let localMenuPdfUrl = $state($appSettings.menuPdfUrl || '');
	let uploadingPdf = $state(false);
	let localOffers = $state(
		$appSettings.specialOffers && $appSettings.specialOffers.length > 0
			? JSON.parse(JSON.stringify($appSettings.specialOffers))
			: [
					{
						id: 1,
						badge: 'HOT DEAL',
						icon: '✂️',
						title: 'Haircuts Starting @ ₹299',
						desc: 'Get premium haircut styles starting at just ₹299! Limited time offer.',
						oldPrice: '₹400-600',
						newPrice: '₹299'
					},
					{
						id: 2,
						badge: 'FESTIVE SPECIAL',
						icon: '🪔',
						title: 'Festive Beauty Package',
						desc: '15% off* prices are inclusive of the offer',
						oldPrice: '',
						newPrice: '15% OFF*'
					},
					{
						id: 3,
						badge: 'STUDENT OFFER',
						icon: '🎓',
						title: 'College Student Discount',
						desc: 'Get 15% off on all services with valid student ID',
						oldPrice: '',
						newPrice: '15% OFF'
					}
				]
	);
	let localSpecialOffersEnabled = $state($appSettings.specialOffersEnabled ?? true);

	// Check if local changes differ from published DB settings
	let isDirty = $derived(
		$appSettings &&
			(localTickerText !== ($appSettings.promoTickerText || '') ||
				localTickerEnabled !== ($appSettings.promoTickerEnabled ?? true) ||
				localTickerColor1 !== ($appSettings.promoTickerColor1 || '#9333ea') ||
				localTickerColor2 !== ($appSettings.promoTickerColor2 || '#db2777') ||
				localTickerHeight !== ($appSettings.promoTickerHeight || 40) ||
				localMenuImageUrl !== ($appSettings.menuImageUrl || '') ||
				localMenuImageEnabled !== ($appSettings.menuImageEnabled ?? true) ||
				localMenuPdfUrl !== ($appSettings.menuPdfUrl || '') ||
				localVideoUrl !== ($appSettings.promoVideoUrl || '') ||
				localVideoEnabled !== ($appSettings.promoVideoEnabled || false) ||
				localSpecialOffersEnabled !== ($appSettings.specialOffersEnabled ?? true) ||
				JSON.stringify(localOffers) !== JSON.stringify($appSettings.specialOffers || []))
	);

	onMount(() => {
		initAppSettingsListener();
	});

	// Sync local state when appSettings updates from Firestore
	$effect(() => {
		if ($appSettings) {
			// Guarantee empty local states populate from Firestore cloud values
			if (!localMenuImageUrl && $appSettings.menuImageUrl) {
				localMenuImageUrl = $appSettings.menuImageUrl;
			}
			if (!localMenuPdfUrl && $appSettings.menuPdfUrl) {
				localMenuPdfUrl = $appSettings.menuPdfUrl;
			}
			if (!localVideoUrl && $appSettings.promoVideoUrl) {
				localVideoUrl = $appSettings.promoVideoUrl;
			}
			if (!localTickerText && $appSettings.promoTickerText) {
				localTickerText = $appSettings.promoTickerText;
			}

			if (!isDirty && !savingAll && !savingTicker && !savingVideo && !savingMenuImage && !savingMenuPdf && !savingOffers && savingCardIndex === null) {
				localTickerText = $appSettings.promoTickerText || '';
				localTickerEnabled = $appSettings.promoTickerEnabled ?? true;
				localTickerColor1 = $appSettings.promoTickerColor1 || '#9333ea';
				localTickerColor2 = $appSettings.promoTickerColor2 || '#db2777';
				localTickerHeight = $appSettings.promoTickerHeight || 40;
				localMenuImageUrl = $appSettings.menuImageUrl || '';
				localMenuImageEnabled = $appSettings.menuImageEnabled ?? true;
				localMenuPdfUrl = $appSettings.menuPdfUrl || '';
				localVideoUrl = $appSettings.promoVideoUrl || '';
				localVideoEnabled = $appSettings.promoVideoEnabled || false;
				localSpecialOffersEnabled = $appSettings.specialOffersEnabled ?? true;
				if ($appSettings.specialOffers && $appSettings.specialOffers.length > 0) {
					localOffers = JSON.parse(JSON.stringify($appSettings.specialOffers));
				}
			}
		}
	});

	// Quick Ticker Presets
	const tickerPresets = [
		{
			label: '✨ Festive Special',
			text: '✨ FESTIVE SPECIAL: Get 15% OFF on all Premium Beauty Packages this week! Tap to book now. ✨'
		},
		{
			label: '🔥 Flash Sale',
			text: '🔥 FLASH SALE: 20% OFF on Hair Spa & Facial Treatments today only! Book online now! 💇‍♀️'
		},
		{
			label: '🎓 Student Discount',
			text: '🎓 STUDENT DISCOUNT: Show valid student ID & get 15% OFF all beauty services! ✂️'
		},
		{
			label: '🎁 Monsoon Glow',
			text: '🎁 MONSOON SPECIAL: Book any 2 services & get 1 complimentary hair styling session! 🌸'
		}
	];

	// Popular Emojis for Card Icons
	const popularEmojis = ['✂️', '🪔', '🎓', '💅', '💆‍♀️', '🧴', '🏷️', '🔥', '🎁', '⭐', '⚡', '👑', '🌸', '💄', '✨'];

	// Stock Image Presets
	const imagePresets = [
		{ label: '✂️ Haircut Styling', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=80' },
		{ label: '💆 Facial & Spa', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=200&q=80' },
		{ label: '💅 Nail Art & Care', url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=200&q=80' },
		{ label: '🪔 Festive Makeup', url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80' }
	];

	// Preset Badges
	const badgePresets = [
		'HOT DEAL',
		'FESTIVE SPECIAL',
		'STUDENT OFFER',
		'FLASH SALE',
		'LIMITED TIME',
		'VIP EXCLUSIVE',
		'POPULAR'
	];

	// Extract YouTube Video Embed URL
	function getYouTubeEmbedUrl(url: string): string | null {
		if (!url) return null;
		const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
		const match = url.match(regExp);
		return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
	}

	let youtubeEmbedUrl = $derived(getYouTubeEmbedUrl(localVideoUrl));

	// Derived filtered offers for search & category
	let filteredOffers = $derived(
		localOffers.filter((o) => {
			const matchesSearch =
				o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				o.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
				o.desc.toLowerCase().includes(searchQuery.toLowerCase());

			if (categoryFilter === 'ALL') return matchesSearch;
			if (categoryFilter === 'HOT') return matchesSearch && o.badge.toUpperCase().includes('HOT');
			if (categoryFilter === 'FESTIVE') return matchesSearch && o.badge.toUpperCase().includes('FESTIVE');
			if (categoryFilter === 'STUDENT') return matchesSearch && o.badge.toUpperCase().includes('STUDENT');
			return matchesSearch;
		})
	);

	// Get Card Badge Theme Class
	function getBadgeStyleClass(badgeText: string): string {
		const upper = (badgeText || '').toUpperCase();
		if (upper.includes('HOT') || upper.includes('FLASH')) return 'badge-hot';
		if (upper.includes('FESTIVE') || upper.includes('GOLD')) return 'badge-festive';
		if (upper.includes('STUDENT')) return 'badge-student';
		if (upper.includes('VIP') || upper.includes('LIMITED')) return 'badge-vip';
		return 'badge-default';
	}

	// Save Marquee Ticker
	async function saveTicker() {
		if (savingTicker) return;
		savingTicker = true;
		const success1 = await updateAppSetting('promoTickerText', localTickerText);
		const success2 = await updateAppSetting('promoTickerEnabled', localTickerEnabled);
		const success3 = await updateAppSetting('promoTickerColor1', localTickerColor1);
		const success4 = await updateAppSetting('promoTickerColor2', localTickerColor2);
		const success5 = await updateAppSetting('promoTickerHeight', localTickerHeight);

		if (success1 && success2 && success3 && success4 && success5) {
			showToast('Promo Marquee Ticker published successfully!', 'success');
		} else {
			showToast('Failed to publish marquee ticker.', 'error');
		}
		savingTicker = false;
	}

	// Reset Marquee Ticker to factory defaults
	function resetTickerDefaults() {
		localTickerText = '✨ FESTIVE SPECIAL: Get 15% OFF on all Premium Beauty Packages this week! Tap to book now. ✨';
		localTickerEnabled = true;
		localTickerColor1 = '#9333ea';
		localTickerColor2 = '#db2777';
		localTickerHeight = 40;
		showToast('Reset marquee settings to default values.', 'info');
	}

	// Save Video Settings
	async function saveVideoSettings() {
		if (savingVideo) return;
		savingVideo = true;
		const success1 = await updateAppSetting('promoVideoUrl', localVideoUrl);
		const success2 = await updateAppSetting('promoVideoEnabled', localVideoEnabled);

		if (success1 && success2) {
			showToast('Video Ad spotlight published successfully!', 'success');
		} else {
			showToast('Failed to publish video settings.', 'error');
		}
		savingVideo = false;
	}

	// Upload base64 data URL to Firebase Storage and get permanent HTTPS URL
	async function uploadDataUrlToStorage(dataUrl: string, folder: string = 'menu_images'): Promise<string> {
		if (!dataUrl || !dataUrl.startsWith('data:image/')) {
			return dataUrl;
		}
		try {
			const res = await fetch(dataUrl);
			const blob = await res.blob();
			const filename = `${folder}/img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`;
			const imgRef = storageRef(storage, filename);
			await uploadBytes(imgRef, blob, { contentType: 'image/webp' });
			const downloadUrl = await getDownloadURL(imgRef);
			return downloadUrl;
		} catch (err) {
			console.error('Failed to upload image to Firebase Storage:', err);
			return dataUrl;
		}
	}

	// Save Menu Image
	async function saveMenuImage() {
		if (savingMenuImage) return;
		savingMenuImage = true;
		try {
			if (localMenuImageUrl && localMenuImageUrl.startsWith('data:image/')) {
				localMenuImageUrl = await uploadDataUrlToStorage(localMenuImageUrl, 'menu_images');
			}
			const success1 = await updateAppSetting('menuImageUrl', localMenuImageUrl);
			const success2 = await updateAppSetting('menuImageEnabled', localMenuImageEnabled);

			if (success1 && success2) {
				showToast('Menu Image uploaded to Cloud & published successfully!', 'success');
			} else {
				showToast('Failed to publish menu image.', 'error');
			}
		} catch (err) {
			console.error('Error saving menu image:', err);
			showToast('Error uploading menu image to Cloud Storage.', 'error');
		} finally {
			savingMenuImage = false;
		}
	}

	// Save Menu PDF
	async function saveMenuPdf() {
		if (savingMenuPdf) return;
		savingMenuPdf = true;
		const success = await updateAppSetting('menuPdfUrl', localMenuPdfUrl);

		if (success) {
			showToast('Menu PDF published successfully!', 'success');
		} else {
			showToast('Failed to publish menu PDF.', 'error');
		}
		savingMenuPdf = false;
	}

	// Check if a single offer card has unsaved draft changes
	function isCardDirty(index: number): boolean {
		const current = localOffers[index];
		if (!current) return false;
		const original = $appSettings?.specialOffers?.[index];
		if (!original) return true; // New unsaved card draft

		return (
			(current.title || '').trim() !== (original.title || '').trim() ||
			(current.badge || '').trim() !== (original.badge || '').trim() ||
			(current.desc || '').trim() !== (original.desc || '').trim() ||
			(current.icon || '').trim() !== (original.icon || '').trim() ||
			(current.oldPrice || '').trim() !== (original.oldPrice || '').trim() ||
			(current.newPrice || '').trim() !== (original.newPrice || '').trim() ||
			(current.image || '') !== (original.image || '') ||
			(current.mediaType || 'emoji') !== (original.mediaType || 'emoji') ||
			(current.enabled !== false) !== (original.enabled !== false)
		);
	}

	// Save Individual Offer Card
	async function saveSingleCard(index: number) {
		if (savingCardIndex !== null) return;
		savingCardIndex = index;
		try {
			if (localOffers[index]?.image && localOffers[index].image.startsWith('data:image/')) {
				localOffers[index].image = await uploadDataUrlToStorage(localOffers[index].image, 'offer_images');
			}
			const success = await updateAppSetting('specialOffers', localOffers);
			if (success) {
				showToast(`Card #${index + 1} ("${localOffers[index].title || 'Offer'}") published successfully!`, 'success');
			} else {
				showToast(`Failed to publish Card #${index + 1}.`, 'error');
			}
		} catch (err) {
			console.error('Error saving card:', err);
			showToast(`Error publishing Card #${index + 1}.`, 'error');
		} finally {
			savingCardIndex = null;
		}
	}

	// Discard Single Card Draft Changes
	function discardSingleCard(index: number) {
		const originalCard = $appSettings?.specialOffers?.[index];
		if (originalCard) {
			localOffers[index] = JSON.parse(JSON.stringify(originalCard));
			showToast(`Card #${index + 1} changes discarded`, 'info');
		} else {
			// Clear input fields for newly added draft card
			localOffers[index].title = '';
			localOffers[index].badge = 'HOT DEAL';
			localOffers[index].desc = '';
			localOffers[index].icon = '✂️';
			localOffers[index].oldPrice = '';
			localOffers[index].newPrice = '';
			localOffers[index].image = '';
			localOffers[index].rawImage = '';
			localOffers[index].mediaType = 'emoji';
			showToast(`Card #${index + 1} draft reset`, 'info');
		}
	}

	// Save All Offers Cards
	async function saveAllOffers() {
		if (savingOffers) return;
		savingOffers = true;
		try {
			for (let i = 0; i < localOffers.length; i++) {
				if (localOffers[i]?.image && localOffers[i].image.startsWith('data:image/')) {
					localOffers[i].image = await uploadDataUrlToStorage(localOffers[i].image, 'offer_images');
				}
			}
			const success1 = await updateAppSetting('specialOffers', localOffers);
			const success2 = await updateAppSetting('specialOffersEnabled', localSpecialOffersEnabled);
			if (success1 && success2) {
				showToast('All Special Offer Cards published successfully!', 'success');
			} else {
				showToast('Failed to publish offer cards.', 'error');
			}
		} catch (err) {
			console.error('Error saving all offers:', err);
			showToast('Error uploading offer images to Cloud Storage.', 'error');
		} finally {
			savingOffers = false;
		}
	}

	// Reset changes to live DB values
	function resetChanges() {
		localTickerText = $appSettings.promoTickerText || '';
		localTickerEnabled = $appSettings.promoTickerEnabled ?? true;
		localTickerColor1 = $appSettings.promoTickerColor1 || '#9333ea';
		localTickerColor2 = $appSettings.promoTickerColor2 || '#db2777';
		localTickerHeight = $appSettings.promoTickerHeight || 40;
		localMenuImageUrl = $appSettings.menuImageUrl || '';
		localMenuImageEnabled = $appSettings.menuImageEnabled ?? true;
		localMenuPdfUrl = $appSettings.menuPdfUrl || '';
		localVideoUrl = $appSettings.promoVideoUrl || '';
		localVideoEnabled = $appSettings.promoVideoEnabled || false;
		localSpecialOffersEnabled = $appSettings.specialOffersEnabled ?? true;
		if ($appSettings.specialOffers) {
			localOffers = JSON.parse(JSON.stringify($appSettings.specialOffers));
		}
		showToast('Reverted changes to live database values.', 'info');
	}

	// Add new offer card
	function addOfferCard() {
		const newId = localOffers.length > 0 ? Math.max(...localOffers.map((o) => o.id || 0)) + 1 : 1;
		localOffers = [
			...localOffers,
			{
				id: newId,
				badge: 'HOT DEAL',
				icon: '✨',
				title: 'New Special Offer',
				desc: 'Describe this exciting deal for your customers...',
				oldPrice: '₹499',
				newPrice: '₹299'
			}
		];
		// Ensure offers section is expanded when adding a card
		activeSection = 'offers';
		showToast('New offer card created! Click "Publish Card" to save to live app.', 'info');
	}

	// Remove offer card
	function removeOfferCard(index: number) {
		if (localOffers.length <= 1) {
			showToast('You must have at least one offer card.', 'error');
			return;
		}
		localOffers = localOffers.filter((_, i) => i !== index);
		showToast('Offer card removed. Click "Publish All Cards" to update live site.', 'info');
	}

	// Duplicate offer card
	function duplicateOfferCard(index: number) {
		const original = localOffers[index];
		const newId = localOffers.length > 0 ? Math.max(...localOffers.map((o) => o.id || 0)) + 1 : 1;
		const clone = {
			...JSON.parse(JSON.stringify(original)),
			id: newId,
			title: `${original.title} (Copy)`
		};
		localOffers = [...localOffers.slice(0, index + 1), clone, ...localOffers.slice(index + 1)];
		showToast('Card duplicated successfully!', 'success');
	}

	// Reorder cards
	function moveOfferCard(index: number, direction: 'up' | 'down') {
		const targetIndex = direction === 'up' ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= localOffers.length) return;
		const updated = [...localOffers];
		const temp = updated[index];
		updated[index] = updated[targetIndex];
		updated[targetIndex] = temp;
		localOffers = updated;
	}

	// Select Emoji
	function selectEmoji(offerIndex: number, emoji: string) {
		localOffers[offerIndex].icon = emoji;
		localOffers[offerIndex].mediaType = 'emoji';
	}

	// Select Image Preset
	function selectImagePreset(offerIndex: number, url: string) {
		localOffers[offerIndex].image = url;
		localOffers[offerIndex].rawImage = url;
		localOffers[offerIndex].mediaType = 'image';
	}

	let uploadingImageIndex = $state<number | null>(null);

	// Process and crop uploaded image to optimal 4:3 deal card ratio (1200x900px HD)
	function processAndCropImage(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => {
					const targetWidth = 1200;
					const targetHeight = 900;
					const canvas = document.createElement('canvas');
					canvas.width = targetWidth;
					canvas.height = targetHeight;
					const ctx = canvas.getContext('2d');
					if (!ctx) {
						reject(new Error('Canvas context unavailable'));
						return;
					}

					// Calculate center crop scaling to 4:3
					const targetAspect = targetWidth / targetHeight;
					const imgAspect = img.width / img.height;
					let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

					if (imgAspect > targetAspect) {
						sWidth = img.height * targetAspect;
						sx = (img.width - sWidth) / 2;
					} else {
						sHeight = img.width / targetAspect;
						sy = (img.height - sHeight) / 2;
					}

					ctx.imageSmoothingEnabled = true;
					ctx.imageSmoothingQuality = 'high';
					ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

					try {
						const webpUrl = canvas.toDataURL('image/webp', 0.88);
						resolve(webpUrl);
					} catch {
						const jpegUrl = canvas.toDataURL('image/jpeg', 0.88);
						resolve(jpegUrl);
					}
				};
				img.onerror = () => reject(new Error('Failed to load image'));
				img.src = e.target?.result as string;
			};
			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsDataURL(file);
		});
	}

	// Interactive Image Cropper Modal State
	let cropperModalOpen = $state(false);
	let cropperMode = $state<'offer' | 'menu'>('offer');
	let cropperOfferIndex = $state<number | null>(null);
	let cropperImageSrc = $state<string>('');
	let cropperZoom = $state<number>(1);
	let cropperOffsetX = $state<number>(0);
	let cropperOffsetY = $state<number>(0);
	let cropperNaturalWidth = $state<number>(360);
	let cropperNaturalHeight = $state<number>(270);
	let isDraggingCropper = $state(false);
	let dragStartX = 0;
	let dragStartY = 0;
	let initialOffsetX = 0;
	let initialOffsetY = 0;

	let cropperBaseScale = $derived(
		cropperMode === 'menu'
			? Math.max(
					270 / (cropperNaturalWidth || 270),
					382 / (cropperNaturalHeight || 382)
				)
			: Math.max(
					360 / (cropperNaturalWidth || 360),
					270 / (cropperNaturalHeight || 270)
				)
	);

	let cropperRenderWidth = $derived((cropperNaturalWidth || 360) * cropperBaseScale);
	let cropperRenderHeight = $derived((cropperNaturalHeight || 270) * cropperBaseScale);

	function clampCropperOffsets(targetX: number = cropperOffsetX, targetY: number = cropperOffsetY) {
		const viewportWidth = cropperMode === 'menu' ? 270 : 360;
		const viewportHeight = cropperMode === 'menu' ? 382 : 270;

		const currentW = cropperRenderWidth * cropperZoom;
		const currentH = cropperRenderHeight * cropperZoom;

		// Maximum allowed translate units so image edge NEVER uncovers viewport frame borders:
		const maxTranslateX = Math.max(0, (currentW - viewportWidth) / (2 * cropperZoom));
		const maxTranslateY = Math.max(0, (currentH - viewportHeight) / (2 * cropperZoom));

		cropperOffsetX = Math.max(-maxTranslateX, Math.min(maxTranslateX, targetX));
		cropperOffsetY = Math.max(-maxTranslateY, Math.min(maxTranslateY, targetY));
	}

	function updateCropperZoom(newZoom: number) {
		cropperZoom = Math.max(1, Math.min(3, parseFloat(newZoom.toFixed(2))));
		clampCropperOffsets();
	}

	function handleImageFileUpload(offerIndex: number, event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const rawDataUrl = e.target?.result as string;
			localOffers[offerIndex].rawImage = rawDataUrl;

			const img = new Image();
			img.onload = () => {
				cropperMode = 'offer';
				cropperNaturalWidth = img.naturalWidth || 360;
				cropperNaturalHeight = img.naturalHeight || 270;
				cropperImageSrc = rawDataUrl;
				cropperOfferIndex = offerIndex;
				cropperZoom = 1;
				cropperOffsetX = 0;
				cropperOffsetY = 0;
				cropperModalOpen = true;
				clampCropperOffsets(0, 0);
			};
			img.src = rawDataUrl;
		};
		reader.readAsDataURL(file);
		target.value = '';
	}

	async function handlePdfUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		if (file.type !== 'application/pdf') {
			showToast('Please select a valid PDF file.', 'error');
			target.value = '';
			return;
		}

		if (file.size > 4 * 1024 * 1024) {
			showToast('PDF size should be less than 4MB.', 'error');
			target.value = '';
			return;
		}

		uploadingPdf = true;
		try {
			const pdfRef = storageRef(storage, `menu/salon_menu_${Date.now()}.pdf`);
			await uploadBytes(pdfRef, file);
			const downloadUrl = await getDownloadURL(pdfRef);
			localMenuPdfUrl = downloadUrl;
			showToast('PDF uploaded successfully! Click publish to save.', 'success');
		} catch (error) {
			console.error('PDF upload failed:', error);
			showToast('Failed to upload PDF.', 'error');
		} finally {
			uploadingPdf = false;
			target.value = ''; // Reset input
		}
	}

	function handleMenuImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		if (file.size > 4 * 1024 * 1024) {
			showToast('File size must be less than 4 MB.', 'error');
			target.value = '';
			return;
		}

		const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
		if (!validFormats.includes(file.type)) {
			showToast('Invalid format. Use JPG, PNG or WEBP.', 'error');
			target.value = '';
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const rawDataUrl = e.target?.result as string;

			const img = new Image();
			img.onload = () => {
				if (img.naturalWidth < 397 || img.naturalHeight < 562) {
					showToast('Image must be at least 397x562 (A4 Portrait).', 'error');
					return;
				}
				cropperMode = 'menu';
				cropperNaturalWidth = img.naturalWidth || 397;
				cropperNaturalHeight = img.naturalHeight || 562;
				cropperImageSrc = rawDataUrl;
				cropperOfferIndex = null;
				cropperZoom = 1;
				cropperOffsetX = 0;
				cropperOffsetY = 0;
				cropperModalOpen = true;
				clampCropperOffsets(0, 0);
			};
			img.src = rawDataUrl;
		};
		reader.readAsDataURL(file);
		target.value = '';
	}

	function openCropperForCurrentOffer(offerIndex: number) {
		const imgUrl = localOffers[offerIndex].rawImage || localOffers[offerIndex].image || localOffers[offerIndex].icon;
		if (!imgUrl) return;

		const img = new Image();
		img.onload = () => {
			cropperMode = 'offer';
			cropperNaturalWidth = img.naturalWidth || 360;
			cropperNaturalHeight = img.naturalHeight || 270;
			cropperImageSrc = imgUrl;
			cropperOfferIndex = offerIndex;
			cropperZoom = 1;
			cropperOffsetX = 0;
			cropperOffsetY = 0;
			cropperModalOpen = true;
			clampCropperOffsets(0, 0);
		};
		img.src = imgUrl;
	}

	function handleCropperMouseDown(e: MouseEvent) {
		isDraggingCropper = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		initialOffsetX = cropperOffsetX;
		initialOffsetY = cropperOffsetY;
	}

	function handleCropperMouseMove(e: MouseEvent) {
		if (!isDraggingCropper) return;
		const deltaX = (e.clientX - dragStartX) / cropperZoom;
		const deltaY = (e.clientY - dragStartY) / cropperZoom;
		clampCropperOffsets(initialOffsetX + deltaX, initialOffsetY + deltaY);
	}

	function handleCropperMouseUp() {
		isDraggingCropper = false;
	}

	// Mobile & Tablet Touch Drag, Pan & Pinch Zoom Handlers
	let initialPinchDistance = 0;
	let initialPinchZoom = 1;

	function handleCropperTouchStart(e: TouchEvent) {
		if (e.touches.length === 1) {
			isDraggingCropper = true;
			dragStartX = e.touches[0].clientX;
			dragStartY = e.touches[0].clientY;
			initialOffsetX = cropperOffsetX;
			initialOffsetY = cropperOffsetY;
		} else if (e.touches.length === 2) {
			isDraggingCropper = false;
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			initialPinchDistance = Math.hypot(dx, dy);
			initialPinchZoom = cropperZoom;
		}
	}

	function handleCropperTouchMove(e: TouchEvent) {
		if (e.touches.length === 1 && isDraggingCropper) {
			const deltaX = (e.touches[0].clientX - dragStartX) / cropperZoom;
			const deltaY = (e.touches[0].clientY - dragStartY) / cropperZoom;
			clampCropperOffsets(initialOffsetX + deltaX, initialOffsetY + deltaY);
		} else if (e.touches.length === 2 && initialPinchDistance > 0) {
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			const currentDist = Math.hypot(dx, dy);
			const scale = currentDist / initialPinchDistance;
			const newZoom = Math.max(1, Math.min(3, initialPinchZoom * scale));
			updateCropperZoom(newZoom);
		}
	}

	function handleCropperTouchEnd() {
		isDraggingCropper = false;
		initialPinchDistance = 0;
	}

	function closeCropperModal() {
		cropperModalOpen = false;
		cropperOfferIndex = null;
		cropperImageSrc = '';
	}

	function applyCroppedImage() {
		if (!cropperImageSrc) return;
		if (cropperMode === 'offer' && cropperOfferIndex === null) return;

		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			const canvasWidth = cropperMode === 'menu' ? 397 : 1200;
			const canvasHeight = cropperMode === 'menu' ? 562 : 900;
			const canvas = document.createElement('canvas');
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			const canvasScale = cropperMode === 'menu' ? canvasWidth / 270 : canvasWidth / 360;

			const canvasBaseScale = Math.max(
				canvasWidth / (img.naturalWidth || canvasWidth),
				canvasHeight / (img.naturalHeight || canvasHeight)
			);
			const drawW = (img.naturalWidth || canvasWidth) * canvasBaseScale * cropperZoom;
			const drawH = (img.naturalHeight || canvasHeight) * canvasBaseScale * cropperZoom;

			const drawX = (canvasWidth - drawW) / 2 + (cropperOffsetX * cropperZoom) * canvasScale;
			const drawY = (canvasHeight - drawH) / 2 + (cropperOffsetY * cropperZoom) * canvasScale;

			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(img, drawX, drawY, drawW, drawH);

			try {
				const quality = cropperMode === 'menu' ? 0.7 : 0.8;
				const croppedUrl = canvas.toDataURL('image/webp', quality);
				if (cropperMode === 'menu') {
					localMenuImageUrl = croppedUrl;
				} else if (cropperOfferIndex !== null) {
					localOffers[cropperOfferIndex].image = croppedUrl;
					localOffers[cropperOfferIndex].rawImage = cropperImageSrc;
					localOffers[cropperOfferIndex].mediaType = 'image';
				}
			} catch {
				const quality = cropperMode === 'menu' ? 0.7 : 0.8;
				const croppedUrl = canvas.toDataURL('image/jpeg', quality);
				if (cropperMode === 'menu') {
					localMenuImageUrl = croppedUrl;
				} else if (cropperOfferIndex !== null) {
					localOffers[cropperOfferIndex].image = croppedUrl;
					localOffers[cropperOfferIndex].rawImage = cropperImageSrc;
					localOffers[cropperOfferIndex].mediaType = 'image';
				}
			}

			closeCropperModal();
			showToast('Custom cropped image applied successfully!', 'success');
		};
		img.src = cropperImageSrc;
	}
</script>

<svelte:head>
	<title>Offers & Promotions Engine - BeWell Admin</title>
</svelte:head>

<div class="offers-management-page">
	<!-- HEADER SECTION -->
	<header class="page-header">
		<div class="header-left">
			<div class="badge-tag">
				<Sparkles size="12" />
				MARKETING & PROMOTIONS ENGINE
			</div>
			<h1 class="page-title">
				<div class="icon-gradient-box">
					<Tag size="24" color="#fff" />
				</div>
				Offers & Promotions Studio
			</h1>
			<p class="page-subtitle">
				Expand any offer widget below to manage announcement banners, video spotlight ads, and featured deals.
			</p>
		</div>
	</header>

	<!-- SLEEK LEFT & RIGHT TAB SWITCH -->
	<div class="offers-tab-container">
		<nav class="offers-segmented-tabs" aria-label="Offers View Mode Navigation">
			<button
				type="button"
				class="tab-btn left-tab {activeTab === 'editor' ? 'active' : ''}"
				onclick={() => (activeTab = 'editor')}
			>
				<Layers size="16" />
				<span>Edit Mode</span>
			</button>

			<button
				type="button"
				class="tab-btn right-tab {activeTab === 'preview' ? 'active' : ''}"
				onclick={() => (activeTab = 'preview')}
			>
				<Eye size="16" />
				<span>Live View</span>
			</button>
		</nav>
	</div>

	<!-- TAB CONTENT: LIVE CUSTOMER PREVIEW MODE -->
	{#if activeTab === 'preview'}
		<div class="live-preview-container" in:fade={{ duration: 250 }}>

			<!-- SIMULATED TOP MARQUEE TICKER -->
			{#if localTickerEnabled && localTickerText}
				<div class="simulated-ticker-wrap" style="background: linear-gradient(135deg, {localTickerColor1}, {localTickerColor2}); height: {localTickerHeight}px;">
					<div class="simulated-ticker-track">
						<span class="ticker-text-item">{localTickerText}</span>
						<span class="ticker-text-item">{localTickerText}</span>
						<span class="ticker-text-item">{localTickerText}</span>
					</div>
				</div>
			{/if}

			<!-- SIMULATED MENU IMAGE -->
			{#if localMenuImageEnabled && localMenuImageUrl}
				<div class="simulated-menu-section" style="background: #fdfbf7; border-radius: 20px; padding: 30px 20px; text-align: center; box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);">
					<h2 style="font-family: serif; text-transform: uppercase; letter-spacing: 1.5px; color: #8e9c6c; font-size: 22px; margin-bottom: 6px; font-weight: 700;">SALON MENU</h2>
					<p style="color: #64748b; font-size: 13px; margin-bottom: 24px;">Explore our complete range of services</p>
					
					<img src={localMenuImageUrl} alt="Salon Menu Preview" style="width: 100%; border-radius: 16px; display: block; margin-bottom: 24px; box-shadow: 0 8px 20px rgba(0,0,0,0.15);" />
					
					<button style="background: #9ba879; color: #1e293b; border: none; padding: 14px 28px; border-radius: 30px; font-weight: 700; font-size: 14px; width: 100%; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(155, 168, 121, 0.3); transition: transform 0.2s;">
						<Download size="18" />
						Download Complete Menu
					</button>
				</div>
			{/if}

			<!-- SIMULATED HERO / VIDEO SPOTLIGHT -->
			{#if localVideoEnabled && youtubeEmbedUrl}
				<div class="simulated-video-section">
					<div class="section-tag">PROMOTIONAL SPOTLIGHT</div>
					<div class="video-responsive-wrap">
						<iframe
							src={youtubeEmbedUrl}
							title="Promotional Video Ad"
							frameborder="0"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowfullscreen
						></iframe>
					</div>
				</div>
			{/if}

			<!-- SIMULATED SPECIAL OFFERS GRID -->
			<div class="simulated-offers-section">
				<div class="simulated-section-header">
					<h2>
						<span class="emoji-star">✨</span>
						Special Offers & Hot Deals
						<span class="emoji-star">✨</span>
					</h2>
					<p>Limited time deals crafted exclusively for you</p>
				</div>

				<div class="simulated-offers-grid">
					{#each localOffers as offer, i}
						{@const hasFullBg = (offer.mediaType === 'image' || offer.image || (offer.icon && offer.icon.startsWith('http'))) && offer.mediaType !== 'emoji'}
						{@const bgUrl = offer.image || (offer.icon && offer.icon.startsWith('http') ? offer.icon : '')}

						<div
							class="simulated-offer-card glow-hover {hasFullBg ? 'has-full-cover' : ''}"
							style={hasFullBg ? `background-image: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%), url('${bgUrl}'); background-size: cover; background-position: center;` : ''}
						>
							{#if offer.badge && offer.badge.trim()}
								<div class="sim-badge {getBadgeStyleClass(offer.badge)}">
									{offer.badge}
								</div>
							{/if}

							{#if !hasFullBg && offer.icon && offer.icon.trim()}
								<div class="sim-icon">
									{offer.icon}
								</div>
							{/if}

							{#if offer.title && offer.title.trim()}
								<h3>{offer.title}</h3>
							{/if}

							{#if offer.desc && offer.desc.trim()}
								<p>{offer.desc}</p>
							{/if}

							{#if (offer.oldPrice && offer.oldPrice.trim()) || (offer.newPrice && offer.newPrice.trim())}
								<div class="sim-price-bar">
									{#if offer.oldPrice && offer.oldPrice.trim()}
										<span class="sim-old-price">{offer.oldPrice}</span>
									{/if}
									{#if offer.newPrice && offer.newPrice.trim()}
										<span class="sim-new-price">{offer.newPrice}</span>
									{/if}
								</div>
							{/if}

							<div class="sim-sparkle-line"></div>
							<button class="sim-tc-btn">T&C</button>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<!-- TAB CONTENT: COLLAPSIBLE ACCORDION STUDIO EDITOR -->
		<div class="accordion-editor-layout" in:fade={{ duration: 250 }}>
			
			<!-- SECTION 1: SCROLLING MARQUEE TICKER WIDGET -->
			<div class="accordion-widget-card glass-panel marquee-border {activeSection === 'marquee' ? 'expanded' : 'collapsed'}">
				<!-- WIDGET HEADER BAR (Click to Expand / Collapse) -->
				<button class="widget-header-bar" onclick={() => toggleSection('marquee')}>
					<div class="widget-header-left">
						<div class="panel-icon purple">
							<Sparkles size="20" />
						</div>
						<div class="widget-title-box">
							<h2>Scrolling Announcement Marquee</h2>
						</div>
					</div>

					<div class="widget-header-right">
						<div class="header-toggle-wrap" onclick={(e) => e.stopPropagation()} role="presentation">
							<label class="toggle-switch-wrap" title="Toggle Marquee Banner ON/OFF">
								<input type="checkbox" bind:checked={localTickerEnabled} />
								<span class="toggle-slider"></span>
							</label>
						</div>
					</div>
				</button>

				<!-- EXPANDABLE CONTENT BODY -->
				{#if activeSection === 'marquee'}
					<div class="accordion-body" in:slide={{ duration: 250 }} out:slide={{ duration: 200 }}>
						<div class="section-controls-top">
							<p class="section-desc">Top headline banner displayed continuously at the top of customer screens.</p>
						</div>

						<!-- Live Ticker Animation Preview -->
						{#if localTickerEnabled}
							<div style="margin-bottom: 20px;">
								<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
									<span style="font-size: 11.5px; font-weight: 800; color: #9333ea; letter-spacing: 0.5px;">LIVE MARQUEE PREVIEW</span>
									<span style="font-size: 11px; color: #64748b;">{localTickerHeight}px Height</span>
								</div>
								<div
									class="live-ticker-preview-box"
									style="background: linear-gradient(135deg, {localTickerColor1}, {localTickerColor2}); height: {localTickerHeight}px; margin-bottom: 0;"
									in:slide={{ duration: 200 }}
								>
									<div class="marquee-track">
										<span>{localTickerText || 'Enter announcement text below...'}</span>
										<span>{localTickerText || 'Enter announcement text below...'}</span>
									</div>
								</div>
							</div>
						{:else}
							<div class="video-placeholder-box muted marquee-off-box">
								<Sparkles size="24" />
								<p>Marquee Ticker is currently turned OFF. Toggle active switch above to enable banner.</p>
							</div>
						{/if}

						<!-- Color & Height Customization Controls -->
						<div style="margin-top: 20px; margin-bottom: 24px; background: rgba(0,0,0,0.02); padding: 18px; border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); display: flex; gap: 24px; flex-wrap: wrap;">
							<!-- Gradient Color Pickers -->
							<div style="flex: 2; min-width: 260px;">
								<label style="font-size: 12.5px; font-weight: 700; color: #0f172a; margin-bottom: 8px; display: block;">Banner Gradient Colors</label>
								<div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 10px;">
									<div style="display: flex; align-items: center; gap: 8px; background: #ffffff; padding: 6px 12px; border-radius: 10px; border: 1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
										<span style="font-size: 12px; font-weight: 600; color: #64748b;">Color 1:</span>
										<input type="color" bind:value={localTickerColor1} style="width: 28px; height: 28px; border: none; border-radius: 6px; cursor: pointer; padding: 0; background: none;" />
										<span style="font-size: 12px; font-family: monospace; font-weight: 600; color: #0f172a;">{localTickerColor1}</span>
									</div>
									<div style="display: flex; align-items: center; gap: 8px; background: #ffffff; padding: 6px 12px; border-radius: 10px; border: 1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
										<span style="font-size: 12px; font-weight: 600; color: #64748b;">Color 2:</span>
										<input type="color" bind:value={localTickerColor2} style="width: 28px; height: 28px; border: none; border-radius: 6px; cursor: pointer; padding: 0; background: none;" />
										<span style="font-size: 12px; font-family: monospace; font-weight: 600; color: #0f172a;">{localTickerColor2}</span>
									</div>
								</div>
								<!-- Preset Gradient Palettes -->
								<div style="display: flex; gap: 6px; flex-wrap: wrap;">
									<button type="button" class="preset-chip" onclick={() => { localTickerColor1 = '#9333ea'; localTickerColor2 = '#db2777'; }}>Purple / Pink</button>
									<button type="button" class="preset-chip" onclick={() => { localTickerColor1 = '#0d9488'; localTickerColor2 = '#06b6d4'; }}>Teal / Cyan</button>
									<button type="button" class="preset-chip" onclick={() => { localTickerColor1 = '#f59e0b'; localTickerColor2 = '#ef4444'; }}>Sunset Orange</button>
									<button type="button" class="preset-chip" onclick={() => { localTickerColor1 = '#15803d'; localTickerColor2 = '#047857'; }}>Emerald</button>
									<button type="button" class="preset-chip" onclick={() => { localTickerColor1 = '#1e293b'; localTickerColor2 = '#475569'; }}>Midnight</button>
								</div>
							</div>

							<!-- Banner Height Range Slider -->
							<div style="flex: 1; min-width: 200px;">
								<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
									<label style="font-size: 12.5px; font-weight: 700; color: #0f172a;">Banner Height</label>
									<span style="font-size: 12px; font-weight: 800; color: #9333ea; background: rgba(147,51,234,0.1); padding: 2px 8px; border-radius: 6px;">{localTickerHeight}px</span>
								</div>
								<input
									type="range"
									min="30"
									max="60"
									step="2"
									bind:value={localTickerHeight}
									style="width: 100%; accent-color: #9333ea; cursor: pointer; margin-top: 6px;"
								/>
								<div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-top: 6px;">
									<span>Compact (30px)</span>
									<span>Tall (60px)</span>
								</div>
							</div>
						</div>

						<!-- Textarea Input -->
						<div class="input-group">
							<div class="input-header">
								<label for="ticker-input">Announcement Banner Text</label>
								<span class="char-count">{localTickerText.length}/120 characters</span>
							</div>
							<textarea
								id="ticker-input"
								class="form-textarea"
								rows="2"
								maxlength="120"
								bind:value={localTickerText}
								placeholder="e.g. ✨ FESTIVE SPECIAL: Get 15% OFF on all Beauty Packages this week! ✨"
							></textarea>
						</div>

						<!-- Presets Palette -->
						<div class="presets-row">
							<span class="presets-label"><Zap size="14" /> Quick Announcement Presets:</span>
							<div class="presets-buttons">
								{#each tickerPresets as preset}
									<button
										class="preset-chip"
										onclick={() => (localTickerText = preset.text)}
										title="Click to apply this preset"
									>
										{preset.label}
									</button>
								{/each}
							</div>
						</div>

						<!-- Bottom Right Corner Publish Bar -->
						<div class="widget-footer-bar" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
							<button type="button" class="btn btn-outline" onclick={resetTickerDefaults} title="Reset marquee settings to default values">
								<RotateCcw size="15" />
								<span>Reset Defaults</span>
							</button>
							<button class="btn btn-save-sm" onclick={saveTicker} disabled={savingTicker}>
								{#if savingTicker}
									<div class="spinner-sm"></div>
									<span>Publishing...</span>
								{:else}
									<Save size="15" />
									<span>Publish Marquee</span>
								{/if}
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- SECTION: MENU IMAGE WIDGET -->
			<div class="accordion-widget-card glass-panel menu-border {activeSection === 'menu' ? 'expanded' : 'collapsed'}">
				<button class="widget-header-bar" onclick={() => toggleSection('menu')}>
					<div class="widget-header-left">
						<div class="panel-icon teal">
							<ImageIcon size="20" />
						</div>
						<div class="widget-title-box">
							<h2>Salon Menu Image</h2>
						</div>
					</div>

					<div class="widget-header-right">
						<div class="header-toggle-wrap" onclick={(e) => e.stopPropagation()} role="presentation">
							<label class="toggle-switch-wrap" title="Toggle Menu Image ON/OFF">
								<input type="checkbox" bind:checked={localMenuImageEnabled} />
								<span class="toggle-slider"></span>
							</label>
						</div>
					</div>
				</button>

				{#if activeSection === 'menu'}
					<div class="accordion-body" in:slide={{ duration: 250 }} out:slide={{ duration: 200 }}>
						<div class="section-controls-top" style="margin-top: 16px;">
							<p class="section-desc">Upload and manage the HD Salon Menu image (A4 format) and downloadable PDF version for customers.</p>
						</div>

						<!-- Resolution & Format Banner -->
						<div class="resolution-info-bar" style="margin-bottom: 24px; border-radius: 12px; padding: 12px 18px;">
							<div class="res-item">
								<span class="res-label">Recommended Dimension:</span>
								<span class="res-value gold">397 × 562 px (A4 Portrait)</span>
							</div>
							<div class="res-item">
								<span class="res-label">Supported Formats:</span>
								<span class="res-value cyan">JPEG, PNG, WebP, PDF (Max 4MB)</span>
							</div>
						</div>

						<!-- SUB-SECTION 1: MENU IMAGE UPLOAD & PREVIEW -->
						<div class="inner-glass-card" style="margin-bottom: 24px; background: #ffffff; border: 1.5px solid #cbd5e1; padding: 20px; border-radius: 16px;">
							<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
								<div class="field-title" style="font-size: 15px; font-weight: 800; color: #0f172a;">1. HD Salon Menu Image</div>
								{#if localMenuImageUrl}
									<span style="font-size: 11px; font-weight: 800; color: #0d9488; background: rgba(13,148,136,0.1); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(13,148,136,0.2);">
										✓ Live Image Active
									</span>
								{/if}
							</div>
							<p class="field-hint" style="margin-bottom: 16px;">This image will be displayed on the customer home page when users open the Salon Menu.</p>

							<!-- TOP: Current Image Preview Box -->
							{#if localMenuImageUrl}
								<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; background: #f8fafc; padding: 18px; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
									<span style="font-size: 11.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px;">CURRENT LIVE PREVIEW</span>
									<a href={localMenuImageUrl} target="_blank" rel="noopener noreferrer" title="Click to open full high-res image">
										<img src={localMenuImageUrl} alt="Current Menu Preview" style="max-width: 180px; max-height: 240px; object-fit: contain; border-radius: 12px; box-shadow: 0 6px 18px rgba(0,0,0,0.12); border: 1px solid #cbd5e1; transition: transform 0.2s;" />
									</a>
									<a href={localMenuImageUrl} target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="font-size: 11.5px; padding: 5px 14px; display: inline-flex; align-items: center; gap: 4px;">
										<Eye size="13" /> View Full Image
									</a>
								</div>
							{/if}

							<!-- BOTTOM: Dropzone Upload Box (Select New Image / Replace) -->
							<div class="media-upload-area" style="padding: 24px; border-radius: 14px; text-align: center; background: #f8fafc; border: 2px dashed #cbd5e1;">
								<input
									type="file"
									id="menuImageUpload"
									accept="image/jpeg, image/png, image/webp"
									onchange={handleMenuImageUpload}
									style="display: none;"
								/>
								<label for="menuImageUpload" class="btn btn-outline" style="cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-weight: 600;">
									<ImageIcon size="18" />
									<span>{localMenuImageUrl ? 'Select New Image (Replace)' : 'Select Image (Min 397x562)'}</span>
								</label>
							</div>

							<div class="form-actions" style="margin-top: 20px; display: flex; justify-content: flex-end;">
								<button class="btn btn-save-sm" onclick={saveMenuImage} disabled={savingMenuImage}>
									{#if savingMenuImage}
										<RefreshCw class="spin" size="16" /> Publishing Image...
									{:else}
										<Save size="16" /> Publish Menu Image
									{/if}
								</button>
							</div>
						</div>

						<!-- SUB-SECTION 2: MENU PDF UPLOAD & DOWNLOAD -->
						<div class="inner-glass-card" style="background: #ffffff; border: 1.5px solid #cbd5e1; padding: 20px; border-radius: 16px;">
							<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
								<div class="field-title" style="font-size: 15px; font-weight: 800; color: #0f172a;">2. Downloadable Menu PDF (Optional)</div>
								{#if localMenuPdfUrl}
									<span style="font-size: 11px; font-weight: 800; color: #0f766e; background: rgba(15,118,110,0.1); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(15,118,110,0.2);">
										✓ Cloud PDF Available
									</span>
								{/if}
							</div>
							<p class="field-hint" style="margin-bottom: 16px;">Upload a PDF version of your menu. When users click "Download Complete Menu" in the app, this PDF file will be downloaded directly.</p>

							<div class="media-upload-area" style="padding: 24px; border-radius: 14px; background: #f8fafc; border: 2px dashed #cbd5e1;">
								<input
									type="file"
									id="menuPdfUpload"
									accept="application/pdf"
									onchange={handlePdfUpload}
									style="display: none;"
								/>
								<div style="display: flex; gap: 14px; flex-wrap: wrap; align-items: center; justify-content: center;">
									<label for="menuPdfUpload" class="btn btn-outline" style="cursor: pointer; display: inline-flex; align-items: center; gap: 8px; opacity: {uploadingPdf ? '0.5' : '1'}; font-weight: 600;">
										<FileText size="18" />
										<span>{uploadingPdf ? 'Uploading PDF...' : (localMenuPdfUrl ? 'Replace PDF (Max 4MB)' : 'Select PDF File (Max 4MB)')}</span>
									</label>

									{#if localMenuPdfUrl && !uploadingPdf}
										<a href={localMenuPdfUrl} target="_blank" download="Bewell_Salon_Menu.pdf" class="btn btn-outline" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; border-color: #0f766e; color: #0f766e; background: rgba(15,118,110,0.05);">
											<Download size="18" /> Download Current PDF
										</a>
									{/if}
								</div>
							</div>

							<div class="form-actions" style="margin-top: 20px; display: flex; justify-content: flex-end;">
								<button class="btn btn-save-sm" onclick={saveMenuPdf} disabled={savingMenuPdf}>
									{#if savingMenuPdf}
										<RefreshCw class="spin" size="16" /> Publishing PDF...
									{:else}
										<Save size="16" /> Publish Menu PDF
									{/if}
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- SECTION 2: PROMOTIONAL VIDEO AD SPOTLIGHT WIDGET -->
			<div class="accordion-widget-card glass-panel video-border {activeSection === 'video' ? 'expanded' : 'collapsed'}">
				<!-- WIDGET HEADER BAR (Click to Expand / Collapse) -->
				<button class="widget-header-bar" onclick={() => toggleSection('video')}>
					<div class="widget-header-left">
						<div class="panel-icon orange">
							<Tv size="20" />
						</div>
						<div class="widget-title-box">
							<h2>Promotional Video Ad Spotlight</h2>
						</div>
					</div>

					<div class="widget-header-right">
						<div class="header-toggle-wrap" onclick={(e) => e.stopPropagation()} role="presentation">
							<label class="toggle-switch-wrap" title="Toggle Video Spotlight ON/OFF">
								<input type="checkbox" bind:checked={localVideoEnabled} />
								<span class="toggle-slider"></span>
							</label>
						</div>
					</div>
				</button>

				<!-- EXPANDABLE CONTENT BODY -->
				{#if activeSection === 'video'}
					<div class="accordion-body" in:slide={{ duration: 250 }} out:slide={{ duration: 200 }}>
						<div class="section-controls-top">
							<p class="section-desc">Embed an exciting YouTube promotional video ad on the customer homepage.</p>
						</div>

						<div class="video-editor-body">
							<div class="input-group">
								<div class="input-header">
									<label for="video-url-input">YouTube Video Link</label>
									<span class="char-count">{localVideoUrl.length}/200</span>
								</div>
								<div class="input-with-icon">
									<Play size="18" class="field-icon" />
									<input
										id="video-url-input"
										type="text"
										class="form-input indented"
										maxlength="200"
										bind:value={localVideoUrl}
										placeholder="https://www.youtube.com/watch?v=..."
									/>
								</div>
							</div>

							<!-- Embed Player Preview -->
							<div class="video-preview-container">
								{#if localVideoEnabled && youtubeEmbedUrl}
									<div class="video-embed-box">
										<iframe
											src={youtubeEmbedUrl}
											title="YouTube Video Preview"
											frameborder="0"
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
											allowfullscreen
										></iframe>
									</div>
								{:else if localVideoEnabled}
									<div class="video-placeholder-box error">
										<AlertCircle size="32" />
										<p>Invalid or empty YouTube Video URL. Paste a valid YouTube link above.</p>
									</div>
								{:else}
									<div class="video-placeholder-box muted">
										<Tv size="32" />
										<p>Video Spotlight is currently turned OFF. Toggle active switch above to enable.</p>
									</div>
								{/if}
							</div>
						</div>

						<!-- Bottom Right Corner Publish Bar -->
						<div class="widget-footer-bar">
							<button class="btn btn-save-sm" onclick={saveVideoSettings} disabled={savingVideo}>
								{#if savingVideo}
									<div class="spinner-sm"></div>
									<span>Publishing...</span>
								{:else}
									<Save size="15" />
									<span>Publish Video</span>
								{/if}
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- SECTION 3: FEATURED SPECIAL OFFER CARDS STUDIO WIDGET -->
			<div class="accordion-widget-card glass-panel offers-border {activeSection === 'offers' ? 'expanded' : 'collapsed'}">
				<!-- WIDGET HEADER BAR (Click to Expand / Collapse) -->
				<button class="widget-header-bar" onclick={() => toggleSection('offers')}>
					<div class="widget-header-left">
						<div class="panel-icon gold">
							<TrendingUp size="20" />
						</div>
						<div class="widget-title-box">
							<h2>Featured Deal Cards Studio</h2>
						</div>
					</div>

					<div class="widget-header-right">
						<div class="header-toggle-wrap" onclick={(e) => e.stopPropagation()} role="presentation">
							<label class="toggle-switch-wrap" title="Toggle Featured Deal Cards ON/OFF">
								<input type="checkbox" bind:checked={localSpecialOffersEnabled} />
								<span class="toggle-slider"></span>
							</label>
						</div>
					</div>
				</button>

				<!-- EXPANDABLE CONTENT BODY -->
				{#if activeSection === 'offers'}
					<div class="accordion-body" in:slide={{ duration: 250 }} out:slide={{ duration: 200 }}>
						<div class="offers-studio-header">
							<p class="section-desc">Customize titles, badges, icons, prices, and descriptions for homepage deal cards.</p>

							<div class="studio-actions">
								<!-- Category Filter Tabs -->
								<div class="category-filter-pills">
									<button
										class="cat-pill {categoryFilter === 'ALL' ? 'active' : ''}"
										onclick={() => (categoryFilter = 'ALL')}
									>
										All ({localOffers.length})
									</button>
									<button
										class="cat-pill {categoryFilter === 'HOT' ? 'active' : ''}"
										onclick={() => (categoryFilter = 'HOT')}
									>
										🔥 Hot Deals
									</button>
									<button
										class="cat-pill {categoryFilter === 'FESTIVE' ? 'active' : ''}"
										onclick={() => (categoryFilter = 'FESTIVE')}
									>
										🪔 Festive
									</button>
									<button
										class="cat-pill {categoryFilter === 'STUDENT' ? 'active' : ''}"
										onclick={() => (categoryFilter = 'STUDENT')}
									>
										🎓 Student
									</button>
								</div>

								<!-- Search & Add Actions Bar -->
								<div class="studio-search-bar">
									<div class="search-box">
										<Search size="15" class="search-icon" />
										<input type="text" bind:value={searchQuery} placeholder="Filter cards..." />
									</div>

									<button class="btn btn-outline btn-add-deal" onclick={addOfferCard}>
										<Plus size="15" />
										<span>Add Deal Card</span>
									</button>
								</div>
							</div>
						</div>

						<!-- CARDS LIST GRID -->
						<div class="cards-editor-grid">
							{#each filteredOffers as offer, index (offer.id || index)}
								{@const hasFullBg = (offer.mediaType === 'image' || offer.image) && offer.mediaType !== 'emoji'}
								{@const bgUrl = offer.image || (offer.icon && offer.icon.startsWith('http') ? offer.icon : '')}

								<div class="offer-editor-card inner-glass-card" in:fly={{ y: 15, duration: 250 }}>
									<!-- CARD TOOLBAR -->
									<div class="card-toolbar">
										<div class="card-toolbar-left">
											<div class="card-number-badge">
												<Tag size="13" />
												<span>CARD #{index + 1}</span>
											</div>
											<div class="card-theme-tag {getBadgeStyleClass(offer.badge)}">
												{offer.badge || 'DEAL'}
											</div>
										</div>

										<div class="card-toolbar-actions">
											<!-- CARD ENABLE / DISABLE TOGGLE SWITCH ON RIGHT EDGE -->
											<label class="card-enable-toggle" title={offer.enabled !== false ? 'Card Active on Homepage' : 'Card Disabled / Hidden from Homepage'}>
												<input
													type="checkbox"
													checked={offer.enabled !== false}
													onchange={(e) => (offer.enabled = (e.target as HTMLInputElement).checked)}
												/>
												<span class="toggle-slider"></span>
											</label>
											<div class="action-icon-group">
												<button
													class="icon-action-btn"
													onclick={() => moveOfferCard(index, 'up')}
													disabled={index === 0}
													title="Move Card Up"
												>
													<ArrowUp size="15" />
												</button>
												<button
													class="icon-action-btn"
													onclick={() => moveOfferCard(index, 'down')}
													disabled={index === localOffers.length - 1}
													title="Move Card Down"
												>
													<ArrowDown size="15" />
												</button>
												<button
													class="icon-action-btn"
													onclick={() => duplicateOfferCard(index)}
													title="Duplicate Card"
												>
													<Copy size="15" />
												</button>
												<button
													class="icon-action-btn danger"
													onclick={() => removeOfferCard(index)}
													title="Delete Card"
												>
													<Trash2 size="15" />
												</button>
											</div>
										</div>
									</div>

									<!-- CARD SPLIT EDITING LAYOUT -->
									<div class="card-split-layout">
										<!-- LEFT: FORM INPUTS -->
										<div class="card-form-side">
											<!-- Title & Badge Row -->
											<div class="form-row">
												<div class="form-group flex-2">
													<div class="input-header">
														<label for="title-{index}">Headline Title</label>
														<span class="char-count">{(offer.title || '').length}/45</span>
													</div>
													<input
														id="title-{index}"
														type="text"
														class="form-input"
														maxlength="45"
														bind:value={offer.title}
														placeholder="e.g. Festive Special Package"
													/>
												</div>

												<div class="form-group flex-1">
													<div class="input-header">
														<label for="badge-{index}">Top Tag Badge</label>
														<span class="char-count">{(offer.badge || '').length}/18</span>
													</div>
													<input
														id="badge-{index}"
														type="text"
														class="form-input"
														maxlength="18"
														bind:value={offer.badge}
														placeholder="HOT DEAL"
													/>
												</div>
											</div>

											<!-- Quick Badge Selector -->
											<div class="quick-badge-chips">
												{#each badgePresets as preset}
													<button
														class="badge-chip {offer.badge === preset ? 'selected' : ''}"
														onclick={() => (offer.badge = preset)}
													>
														{preset}
													</button>
												{/each}
											</div>

											<!-- Description Input -->
											<div class="form-group">
												<div class="input-header">
													<label for="desc-{index}">Offer Description</label>
													<span class="char-count">{(offer.desc || '').length}/100</span>
												</div>
												<input
													id="desc-{index}"
													type="text"
													class="form-input"
													maxlength="100"
													bind:value={offer.desc}
													placeholder="e.g. 15% OFF on all hair styling & facial packages."
												/>
											</div>

											<!-- Media Type Selection (Emoji OR Image) -->
											<div class="form-group media-selector-group">
												<label for="media-toggle-btn-{index}">Card Media Style (Only 1 Active)</label>
												<div id="media-toggle-btn-{index}" class="media-toggle-buttons">
													<button
														type="button"
														class="media-toggle-btn {(!offer.mediaType || offer.mediaType === 'emoji') ? 'active' : ''}"
														onclick={() => {
															offer.mediaType = 'emoji';
														}}
													>
														<span>😀 Emoji Icon</span>
													</button>
													<button
														type="button"
														class="media-toggle-btn {offer.mediaType === 'image' ? 'active' : ''}"
														onclick={() => {
															offer.mediaType = 'image';
														}}
													>
														<ImageIcon size="15" />
														<span>Full Card Image</span>
													</button>
												</div>
											</div>

											{#if offer.mediaType === 'image'}
												<!-- FULL CARD IMAGE CONTROLS -->
												<div class="image-media-controls" in:slide={{ duration: 200 }}>
													<div class="upload-box-wrap">
														<label class="upload-dropzone">
															<input
																type="file"
																accept="image/webp,image/jpeg,image/jpg,image/png,image/gif,image/svg+xml"
																onchange={(e) => handleImageFileUpload(index, e)}
																class="hidden-file-input"
															/>
															<div class="dropzone-content">
																<Sparkles size="18" class="gold-icon" />
																<span><strong>Upload Image File</strong> (WebP, JPG, PNG) — Interactive Cropper</span>
															</div>
														</label>

														{#if offer.image}
															<button
																type="button"
																class="btn-open-cropper-trigger"
																onclick={() => openCropperForCurrentOffer(index)}
															>
																<Crop size="14" />
																<span>Adjust / Fine-Crop Scale & Alignment</span>
															</button>
														{/if}
													</div>

													<div class="form-group">
														<label for="imgurl-{index}">Or Paste Image Link (URL)</label>
														<input
															id="imgurl-{index}"
															type="text"
															class="form-input"
															maxlength="500"
															bind:value={offer.image}
															placeholder="https://images.unsplash.com/photo-..."
														/>
													</div>

													<!-- Image Presets Palette -->
													<div class="asset-selector-wrap">
														<div class="image-presets-palette">
															<span class="palette-title">Presets:</span>
															<div class="image-presets-list">
																{#each imagePresets as imgP}
																	<button
																		type="button"
																		class="img-preset-btn {offer.image === imgP.url ? 'active' : ''}"
																		onclick={() => selectImagePreset(index, imgP.url)}
																		title={imgP.label}
																	>
																		<img src={imgP.url} alt={imgP.label} />
																	</button>
																{/each}
															</div>
														</div>
													</div>
												</div>
											{:else}
												<!-- EMOJI ICON CONTROLS -->
												<div class="emoji-media-controls" in:slide={{ duration: 200 }}>
													<div class="form-group">
														<label for="icon-{index}">Card Emoji Icon</label>
														<input
															id="icon-{index}"
															type="text"
															class="form-input"
															maxlength="8"
															bind:value={offer.icon}
															placeholder="e.g. ✂️ or 🪔"
														/>
													</div>

													<!-- Quick Emoji Palette -->
													<div class="asset-selector-wrap">
														<div class="emoji-palette">
															<span class="palette-title">Emojis:</span>
															<div class="emoji-list">
																{#each popularEmojis as emoji}
																	<button
																		type="button"
																		class="emoji-btn {offer.icon === emoji ? 'active' : ''}"
																		onclick={() => selectEmoji(index, emoji)}
																	>
																		{emoji}
																	</button>
																{/each}
															</div>
														</div>
													</div>
												</div>
											{/if}

											<!-- Prices Row -->
											<div class="form-row">
												<div class="form-group flex-1">
													<label for="oldprice-{index}">Original Price (Strikethrough)</label>
													<input
														id="oldprice-{index}"
														type="text"
														class="form-input muted-input"
														maxlength="15"
														bind:value={offer.oldPrice}
														placeholder="₹499 or $150"
													/>
												</div>
												<div class="form-group flex-1">
													<label for="newprice-{index}">Offer Price / Tag</label>
													<input
														id="newprice-{index}"
														type="text"
														class="form-input highlight-input"
														maxlength="18"
														bind:value={offer.newPrice}
														placeholder="₹299 or 20% OFF"
													/>
												</div>
											</div>
										</div>

										<!-- RIGHT: REAL-TIME MINI CUSTOMER PREVIEW -->
										<div class="card-preview-column">
											<div class="column-preview-title">
												<Eye size="14" class="gold-icon" />
												<span>LIVE CUSTOMER PREVIEW</span>
											</div>

											<div class="card-preview-side">
												<div
													class="mini-offer-card {hasFullBg ? 'has-full-cover' : ''}"
													style={hasFullBg ? `background-image: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%), url('${bgUrl}'); background-size: cover; background-position: center;` : ''}
												>
													{#if offer.badge && offer.badge.trim()}
														<div class="mini-badge {getBadgeStyleClass(offer.badge)}">{offer.badge}</div>
													{/if}
													{#if !hasFullBg && offer.icon && offer.icon.trim()}
														<div class="mini-icon">
															{offer.icon}
														</div>
													{/if}
													{#if offer.title && offer.title.trim()}
														<div class="mini-title">{offer.title}</div>
													{/if}
													{#if offer.desc && offer.desc.trim()}
														<div class="mini-desc">{offer.desc}</div>
													{/if}
													{#if (offer.oldPrice && offer.oldPrice.trim()) || (offer.newPrice && offer.newPrice.trim())}
														<div class="mini-price">
															{#if offer.oldPrice && offer.oldPrice.trim()}
																<span class="mini-old-price">{offer.oldPrice}</span>
															{/if}
															{#if offer.newPrice && offer.newPrice.trim()}
																<span class="mini-new-price">{offer.newPrice}</span>
															{/if}
														</div>
													{/if}
													<div class="mini-sparkle"></div>
													<div class="mini-tc">T&C</div>

													{#if offer.enabled === false}
														<div class="mini-card-disabled-overlay">
															<span class="disabled-badge-tag">🚫 TEMPORARILY DISABLED</span>
														</div>
													{/if}
												</div>
											</div>
											<!-- ACTION BUTTONS BELOW PREVIEW CARD (ONLY SHOWN WHEN CARD HAS DRAFT MODIFICATIONS) -->
											{#if isCardDirty(index)}
												<div class="card-preview-footer" in:fade={{ duration: 150 }} out:fade={{ duration: 100 }}>
													<button
														type="button"
														class="btn-card-discard-bottom"
														onclick={() => discardSingleCard(index)}
														title="Discard Changes for Card #{index + 1}"
													>
														<RotateCcw size="14" />
														<span>Discard</span>
													</button>

													<button
														class="btn-card-save-bottom"
														onclick={() => saveSingleCard(index)}
														disabled={savingCardIndex === index}
														title="Publish Card #{index + 1}"
													>
														{#if savingCardIndex === index}
															<div class="spinner-sm"></div>
															<span>Publishing...</span>
														{:else}
															<Save size="14" />
															<span>Publish</span>
														{/if}
													</button>
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>

						<!-- Bottom Right Corner Publish Bar for Section 3 -->
						<div class="widget-footer-bar">
							<button class="btn btn-save-sm" onclick={saveAllOffers} disabled={savingOffers}>
								{#if savingOffers}
									<div class="spinner-sm"></div>
									<span>Publishing Cards...</span>
								{:else}
									<Save size="15" />
									<span>Publish All Cards</span>
								{/if}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- INTERACTIVE IMAGE CROPPER & ZOOM SCALE MODAL -->
	{#if cropperModalOpen}
		<div class="cropper-modal-backdrop" in:fade={{ duration: 150 }} out:fade={{ duration: 100 }}>
			<div class="cropper-modal-card glass-panel" in:fly={{ y: 20, duration: 250 }}>
				<div class="cropper-modal-header">
					<div class="cropper-title-box">
						<Crop size="18" class="gold-icon" />
						<h3>Interactive Card Image Cropper & Scale</h3>
					</div>
					<button type="button" class="btn-close-modal" onclick={closeCropperModal} title="Close Cropper">
						<X size="18" />
					</button>
				</div>

				<div class="cropper-modal-body">
					<p class="cropper-hint">
						{#if cropperMode === 'menu'}
							Drag image to position inside A4 portrait frame. Adjust scale ruler to zoom in/out.
						{:else}
							Drag image to position inside 4:3 deal card frame. Adjust scale ruler to zoom in/out.
						{/if}
					</p>

					<!-- RESOLUTION INFO BADGES -->
					<div class="resolution-info-bar">
						<div class="res-item">
							<span class="res-label">Recommended:</span>
							<span class="res-value gold">
								{#if cropperMode === 'menu'}
									397 × 562 px (A4)
								{:else}
									1200 × 900 px (4:3 HD)
								{/if}
							</span>
						</div>
						<div class="res-item">
							<span class="res-label">Current Image:</span>
							<span class="res-value cyan">{cropperNaturalWidth} × {cropperNaturalHeight} px</span>
							{#if cropperMode === 'menu'}
								{#if cropperNaturalWidth >= 397 && cropperNaturalHeight >= 562}
									<span class="res-badge green">Good Quality</span>
								{:else}
									<span class="res-badge orange">Auto-Fitted</span>
								{/if}
							{:else}
								{#if cropperNaturalWidth >= 1200 && cropperNaturalHeight >= 900}
									<span class="res-badge green">HD Quality</span>
								{:else}
									<span class="res-badge orange">Auto-Fitted</span>
								{/if}
							{/if}
						</div>
					</div>

					<!-- CROP VIEWPORT CONTAINER -->
					<div class="crop-viewport-wrapper">
						<div
							class="crop-viewport-box"
							style="width: {cropperMode === 'menu' ? 270 : 360}px; height: {cropperMode === 'menu' ? 382 : 270}px;"
							onmousedown={handleCropperMouseDown}
							onmousemove={handleCropperMouseMove}
							onmouseup={handleCropperMouseUp}
							onmouseleave={handleCropperMouseUp}
							ontouchstart={handleCropperTouchStart}
							ontouchmove={handleCropperTouchMove}
							ontouchend={handleCropperTouchEnd}
							ontouchcancel={handleCropperTouchEnd}
							role="slider"
							aria-valuenow={cropperZoom}
							tabindex="0"
						>
							<img
								src={cropperImageSrc}
								alt="Crop preview"
								class="crop-target-img"
								style="width: {cropperRenderWidth}px; height: {cropperRenderHeight}px; transform: translate3d({cropperOffsetX}px, {cropperOffsetY}px, 0) scale({cropperZoom});"
								draggable="false"
							/>
							<div class="crop-grid-overlay">
								<div class="grid-line horizontal"></div>
								<div class="grid-line vertical"></div>
								<span class="crop-aspect-badge">
									{#if cropperMode === 'menu'}
										A4 Menu Portrait (397×562)
									{:else}
										4 : 3 Deal Card Frame (1200×900 HD)
									{/if}
								</span>
							</div>
						</div>
					</div>

					<!-- ZOOM & SCALE RULER CONTROLS -->
					<div class="cropper-controls-bar">
						<div class="zoom-slider-row">
							<span class="zoom-label">Zoom Scale:</span>
							<button type="button" class="zoom-btn" onclick={() => updateCropperZoom(cropperZoom - 0.1)}>-</button>
							
							<div class="slider-ruler-wrap">
								<input
									type="range"
									min="1"
									max="3"
									step="0.05"
									bind:value={cropperZoom}
									oninput={() => clampCropperOffsets()}
									class="zoom-range-slider"
								/>
								<div class="ruler-ticks">
									<span>1x</span>
									<span>1.5x</span>
									<span>2x</span>
									<span>2.5x</span>
									<span>3x</span>
								</div>
							</div>

							<button type="button" class="zoom-btn" onclick={() => updateCropperZoom(cropperZoom + 0.1)}>+</button>
							<span class="zoom-value-pill">{Math.round(cropperZoom * 100)}%</span>
						</div>

						<div class="cropper-reset-row">
							<button type="button" class="btn-reset-crop" onclick={() => { cropperZoom = 1; cropperOffsetX = 0; cropperOffsetY = 0; }}>
								<RotateCcw size="13" />
								<span>Reset Zoom & Position</span>
							</button>
						</div>
					</div>
				</div>

				<div class="cropper-modal-footer">
					<button type="button" class="btn btn-outline" onclick={closeCropperModal}>Cancel</button>
					<button type="button" class="btn-crop-submit" onclick={applyCroppedImage}>
						<Crop size="15" />
						<span>Crop & Apply Image</span>
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* =============================================
     OFFERS MANAGEMENT ENGINE - STYLING
     ============================================= */

	.offers-management-page {
		padding: 20px 8px 60px;
		max-width: 1380px;
		margin: 0 auto;
		font-family: var(--admin-font);
		color: var(--admin-text-primary);
		animation: pageSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
		position: relative;
	}

	@keyframes pageSlideUp {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* --- Floating Dirty Bar --- */
	.floating-dirty-bar {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		background: #1c1c1e;
		border: 1px solid var(--admin-accent);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(212, 175, 55, 0.3);
		padding: 12px 24px;
		border-radius: 18px;
		display: flex;
		align-items: center;
		gap: 20px;
		backdrop-filter: blur(16px);
	}

	.dirty-text {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		font-weight: 600;
		color: var(--admin-text-primary);
	}

	.warning-icon {
		color: var(--admin-orange);
	}

	.dirty-actions {
		display: flex;
		gap: 10px;
	}

	/* --- Page Header --- */
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 20px;
		gap: 20px;
		flex-wrap: wrap;
	}

	.badge-tag {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 12px;
		background: rgba(212, 175, 55, 0.12);
		border: 1px solid rgba(212, 175, 55, 0.3);
		color: var(--admin-accent);
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 1px;
		border-radius: 8px;
		margin-bottom: 10px;
	}

	.page-title {
		display: flex;
		align-items: center;
		gap: 14px;
		font-family: var(--admin-font-display);
		font-size: 30px;
		font-weight: 800;
		color: var(--admin-text-primary);
		letter-spacing: -0.5px;
		margin-bottom: 6px;
	}

	.icon-gradient-box {
		width: 44px;
		height: 44px;
		background: linear-gradient(135deg, #d4af37 0%, #ff9f0a 100%);
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 20px rgba(212, 175, 55, 0.3);
	}

	.page-subtitle {
		color: var(--admin-text-secondary);
		font-size: 14.5px;
		max-width: 720px;
		line-height: 1.4;
	}

	/* --- 3D Segmented Left & Right Tab Switch --- */
	.offers-tab-container {
		display: flex;
		margin-bottom: 24px;
	}

	.offers-segmented-tabs {
		display: inline-flex;
		align-items: center;
		background: #cbd5e1;
		border: 2.5px solid #475569;
		padding: 6px;
		border-radius: 16px;
		gap: 6px;
		box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.15), 0 6px 16px rgba(0, 0, 0, 0.1);
	}

	.tab-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 24px;
		border-radius: 11px;
		border: 1.5px solid transparent;
		background: transparent;
		color: #334155;
		font-size: 14px;
		font-weight: 800;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.tab-btn:hover {
		color: #0f172a;
		background: rgba(255, 255, 255, 0.5);
	}

	.tab-btn.active {
		background: linear-gradient(180deg, #ffd700 0%, #d4af37 60%, #b8860b 100%) !important;
		border: 1.5px solid #784b00 !important;
		border-bottom: 3.5px solid #5c3800 !important;
		color: #000000 !important;
		font-weight: 900 !important;
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
		box-shadow: 0 4px 14px rgba(184, 134, 11, 0.35) !important;
	}

	.tab-btn.active:active {
		transform: translateY(2px);
		border-bottom: 1px solid #5c3800 !important;
	}

	/* --- 3D Buttons --- */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 11px 22px;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 800;
		cursor: pointer;
		transition: all 0.15s ease;
		border: none;
	}

	.btn-save-sm,
	.btn-card-save,
	.btn-crop-submit {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 22px;
		background: linear-gradient(180deg, #ffd700 0%, #d4af37 60%, #b8860b 100%) !important;
		border: 1.5px solid #996515 !important;
		border-bottom: 4px solid #784b00 !important;
		color: #000000 !important;
		font-size: 13.5px;
		font-weight: 900 !important;
		border-radius: 11px;
		cursor: pointer;
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
		box-shadow: 0 6px 16px rgba(184, 134, 11, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
		transition: all 0.15s ease;
	}

	.btn-save-sm:hover:not(:disabled),
	.btn-card-save:hover:not(:disabled),
	.btn-crop-submit:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 22px rgba(184, 134, 11, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
	}

	.btn-save-sm:active:not(:disabled),
	.btn-card-save:active:not(:disabled),
	.btn-crop-submit:active:not(:disabled) {
		transform: translateY(2px);
		border-bottom: 1px solid #784b00 !important;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
	}

	/* --- ACCORDION WIDGET CARDS (IMMERSIVE GLASS DESIGN) --- */
	.accordion-editor-layout {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.accordion-widget-card {
		border-radius: 20px;
		padding: 0;
		position: relative;
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04);
		border: 1.5px solid rgba(0, 0, 0, 0.08);
	}

	.accordion-widget-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 16px 35px -6px rgba(15, 23, 42, 0.12), 0 6px 16px -4px rgba(15, 23, 42, 0.06);
	}

	.accordion-widget-card.marquee-border {
		background: linear-gradient(135deg, rgba(147, 51, 234, 0.06) 0%, rgba(219, 39, 119, 0.03) 100%), #ffffff;
		border: 1.5px solid rgba(147, 51, 234, 0.3) !important;
	}
	.accordion-widget-card.marquee-border:hover,
	.accordion-widget-card.marquee-border.expanded {
		border-color: rgba(147, 51, 234, 0.6) !important;
		box-shadow: 0 14px 36px -6px rgba(147, 51, 234, 0.15);
	}

	.accordion-widget-card.menu-border {
		background: linear-gradient(135deg, rgba(13, 148, 136, 0.06) 0%, rgba(20, 184, 166, 0.03) 100%), #ffffff;
		border: 1.5px solid rgba(13, 148, 136, 0.3) !important;
	}
	.accordion-widget-card.menu-border:hover,
	.accordion-widget-card.menu-border.expanded {
		border-color: rgba(13, 148, 136, 0.6) !important;
		box-shadow: 0 14px 36px -6px rgba(13, 148, 136, 0.15);
	}

	.accordion-widget-card.video-border {
		background: linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(239, 68, 68, 0.03) 100%), #ffffff;
		border: 1.5px solid rgba(245, 158, 11, 0.3) !important;
	}
	.accordion-widget-card.video-border:hover,
	.accordion-widget-card.video-border.expanded {
		border-color: rgba(245, 158, 11, 0.6) !important;
		box-shadow: 0 14px 36px -6px rgba(245, 158, 11, 0.15);
	}

	.accordion-widget-card.offers-border {
		background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%), #ffffff;
		border: 1.5px solid rgba(212, 175, 55, 0.35) !important;
	}
	.accordion-widget-card.offers-border:hover,
	.accordion-widget-card.offers-border.expanded {
		border-color: rgba(212, 175, 55, 0.7) !important;
		box-shadow: 0 14px 36px -6px rgba(212, 175, 55, 0.18);
	}

	.widget-header-bar {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 24px;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.2s ease;
	}

	.widget-header-bar:hover {
		background: rgba(0, 0, 0, 0.02);
	}

	.widget-header-left {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.widget-header-right {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.widget-title-box h2 {
		font-family: var(--admin-font-display);
		font-size: 1.12rem;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.01em;
		margin: 0;
	}

	.panel-icon {
		width: 44px;
		height: 44px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: transform 0.25s ease;
	}

	.widget-header-bar:hover .panel-icon {
		transform: scale(1.08);
	}

	.panel-icon.purple {
		background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%);
		color: #ffffff;
		box-shadow: 0 4px 14px rgba(126, 34, 206, 0.35);
	}

	.panel-icon.teal {
		background: linear-gradient(135deg, #14b8a6 0%, #0f766e 100%);
		color: #ffffff;
		box-shadow: 0 4px 14px rgba(15, 118, 110, 0.35);
	}

	.panel-icon.orange {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		color: #ffffff;
		box-shadow: 0 4px 14px rgba(217, 119, 6, 0.35);
	}

	.panel-icon.gold {
		background: linear-gradient(135deg, #eab308 0%, #b8860b 100%);
		color: #ffffff;
		box-shadow: 0 4px 14px rgba(184, 134, 11, 0.35);
	}



	/* --- Live Ticker Animation Preview --- */
	.live-ticker-preview-box {
		background: linear-gradient(135deg, #9333ea, #db2777, #f43f5e);
		border-radius: 12px;
		padding: 12px 16px;
		margin-bottom: 20px;
		overflow: hidden;
		position: relative;
		display: flex;
		align-items: center;
		box-shadow: 0 4px 15px rgba(219, 39, 119, 0.3);
	}

	.preview-badge {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(0, 0, 0, 0.6);
		color: #fff;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.8px;
		padding: 3px 8px;
		border-radius: 6px;
		z-index: 2;
	}

	.marquee-track {
		display: flex;
		gap: 40px;
		white-space: nowrap;
		animation: marqueeScroll 18s linear infinite;
		padding-left: 140px;
		color: #ffffff;
		font-weight: 700;
		font-size: 13px;
		letter-spacing: 0.5px;
	}

	@keyframes marqueeScroll {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}

	/* --- Forms & Inputs --- */
	.input-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 20px;
	}

	.input-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.input-group label,
	.form-group label {
		font-size: 13px;
		font-weight: 600;
		color: var(--admin-text-secondary);
	}

	.char-count {
		font-size: 12px;
		color: var(--admin-text-tertiary);
	}

	.form-input,
	.form-textarea {
		width: 100%;
		padding: 12px 16px;
		background: var(--admin-bg);
		border: 1.5px solid var(--admin-border);
		border-radius: 12px;
		color: var(--admin-text-primary);
		font-size: 14px;
		font-family: var(--admin-font);
		transition: all 0.2s ease;
	}

	.form-input:focus,
	.form-textarea:focus {
		outline: none;
		background: var(--admin-surface);
		border-color: var(--admin-accent);
		box-shadow: 0 0 0 4px var(--admin-accent-light);
	}

	.form-textarea {
		resize: none;
		line-height: 1.5;
	}

	.input-with-icon {
		position: relative;
		display: flex;
		align-items: center;
	}

	.field-icon {
		position: absolute;
		left: 14px;
		color: var(--admin-text-tertiary);
		pointer-events: none;
	}

	.form-input.indented {
		padding-left: 42px;
	}

	.muted-input {
		color: var(--admin-text-tertiary);
	}

	.highlight-input {
		color: var(--admin-accent);
		font-weight: 700;
		background: rgba(212, 175, 55, 0.08);
		border-color: rgba(212, 175, 55, 0.3);
	}

	/* Presets Palette */
	.presets-row {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
		margin-top: 12px;
	}

	.presets-label {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		font-weight: 600;
		color: var(--admin-text-tertiary);
	}

	.presets-buttons {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.preset-chip {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--admin-border);
		color: var(--admin-text-secondary);
		padding: 5px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.preset-chip:hover {
		background: rgba(212, 175, 55, 0.15);
		border-color: var(--admin-accent);
		color: var(--admin-accent);
	}

	/* Toggle Switch */
	.toggle-switch-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
	}

	.toggle-switch-wrap input {
		display: none;
	}

	.toggle-slider {
		width: 44px;
		height: 24px;
		background: var(--admin-border);
		border-radius: 24px;
		position: relative;
		transition: all 0.3s ease;
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		width: 18px;
		height: 18px;
		left: 3px;
		top: 3px;
		background: #fff;
		border-radius: 50%;
		transition: all 0.3s ease;
	}

	.toggle-switch-wrap input:checked + .toggle-slider {
		background: var(--admin-accent);
	}

	.toggle-switch-wrap input:checked + .toggle-slider::before {
		transform: translateX(20px);
	}

	.toggle-label {
		font-size: 13px;
		font-weight: 700;
		color: var(--admin-text-secondary);
	}

	/* Video Embed Preview */
	.video-preview-container {
		margin-top: 16px;
	}

	.video-embed-box {
		position: relative;
		padding-bottom: 38%;
		height: 0;
		overflow: hidden;
		border-radius: 16px;
		border: 1px solid var(--admin-border);
		box-shadow: var(--admin-shadow-md);
	}

	.video-embed-box iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.video-placeholder-box {
		padding: 32px;
		border-radius: 16px;
		border: 1.5px dashed var(--admin-border);
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.video-placeholder-box.muted {
		color: var(--admin-text-tertiary);
		background: rgba(255, 255, 255, 0.02);
	}

	.marquee-off-box {
		margin-bottom: 20px;
	}

	.video-placeholder-box.error {
		color: var(--admin-red);
		border-color: rgba(255, 69, 58, 0.3);
		background: rgba(255, 69, 58, 0.05);
	}

	/* --- Featured Deal Cards Studio --- */
	.offers-studio-header {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 16px 0;
	}

	.studio-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.studio-search-bar {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.btn-add-deal {
		padding: 9px 18px;
		font-size: 13px;
		font-weight: 600;
		border-radius: 10px;
		white-space: nowrap;
		background: var(--admin-surface, rgba(255, 255, 255, 0.05));
		border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.12));
		color: var(--admin-text-primary);
		transition: all 0.2s ease;
	}

	.btn-add-deal:hover {
		background: rgba(212, 175, 55, 0.15);
		border-color: var(--admin-accent);
		color: var(--admin-accent);
	}

	/* Category Filter Pills */
	.category-filter-pills {
		display: flex;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.1));
		padding: 4px;
		border-radius: 12px;
		gap: 4px;
		overflow-x: auto;
		max-width: 100%;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.category-filter-pills::-webkit-scrollbar {
		display: none;
	}

	.cat-pill {
		background: transparent;
		border: none;
		color: var(--admin-text-secondary);
		padding: 7px 16px;
		border-radius: 9px;
		font-size: 12.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.cat-pill:hover {
		color: var(--admin-text-primary);
		background: rgba(255, 255, 255, 0.06);
	}

	.cat-pill.active {
		background: linear-gradient(135deg, #d4af37 0%, #ff9f0a 100%);
		color: #000000;
		font-weight: 700;
		border: none;
		box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35);
	}

	.search-box {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-box .search-icon {
		position: absolute;
		left: 12px;
		color: var(--admin-text-tertiary);
	}

	.search-box input {
		padding: 9px 14px 9px 36px;
		background: var(--admin-surface, rgba(255, 255, 255, 0.05));
		border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.12));
		border-radius: 10px;
		color: var(--admin-text-primary);
		font-size: 13px;
		outline: none;
		width: 160px;
		transition: all 0.2s ease;
	}

	.search-box input:focus {
		width: 200px;
		border-color: var(--admin-accent);
		box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
	}

	/* --- Editor Cards Grid --- */
	.cards-editor-grid {
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	.offer-editor-card {
		padding: 24px;
		background: #ffffff !important;
		border: 2px solid rgba(212, 175, 55, 0.35) !important;
		border-left: 8px solid #d4af37 !important;
		border-radius: 20px !important;
		box-shadow: 0 14px 35px -5px rgba(15, 23, 42, 0.12), 0 6px 16px -4px rgba(15, 23, 42, 0.06) !important;
		transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
		margin-bottom: 8px;
	}

	.offer-editor-card:hover {
		border-color: #d4af37 !important;
		box-shadow: 0 20px 42px -6px rgba(212, 175, 55, 0.25), 0 8px 20px -4px rgba(15, 23, 42, 0.1) !important;
		transform: translateY(-2px);
	}

	.card-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px 18px;
		margin-bottom: 24px;
		background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%);
		border: 1.5px solid rgba(212, 175, 55, 0.25);
		border-radius: 14px;
		gap: 12px;
		flex-wrap: wrap;
	}

	.card-toolbar-left {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.card-number-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
		color: #ffffff;
		padding: 6px 14px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 900;
		letter-spacing: 0.5px;
		box-shadow: 0 3px 10px rgba(184, 134, 11, 0.35);
	}

	.card-theme-tag {
		font-size: 11px;
		font-weight: 800;
		padding: 4px 10px;
		border-radius: 6px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.card-toolbar-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.action-icon-group {
		display: flex;
		align-items: center;
		gap: 4px;
		background: rgba(255, 255, 255, 0.06);
		padding: 3px;
		border-radius: 10px;
		border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.1));
	}

	.btn-card-save {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 16px;
		background: linear-gradient(135deg, #d4af37 0%, #ff9f0a 100%);
		border: none;
		color: #000000;
		font-size: 12.5px;
		font-weight: 700;
		border-radius: 9px;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		white-space: nowrap;
		box-shadow: 0 3px 12px rgba(212, 175, 55, 0.3);
	}

	.btn-card-save:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 18px rgba(212, 175, 55, 0.45);
	}

	.btn-card-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.icon-action-btn {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: 1px solid transparent;
		background: transparent;
		color: var(--admin-text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.icon-action-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.12);
		color: var(--admin-text-primary);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.icon-action-btn.danger:hover {
		background: rgba(255, 69, 58, 0.2);
		color: #ff453a;
		border-color: rgba(255, 69, 58, 0.4);
	}

	.icon-action-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	/* Card Split Layout */
	.card-split-layout {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 28px;
	}

	.form-row {
		display: flex;
		gap: 16px;
		margin-bottom: 16px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 16px;
	}

	.form-group label {
		font-size: 12.5px;
		font-weight: 700;
		color: var(--admin-text-primary);
		margin-bottom: 4px;
	}

	.form-group.flex-1 {
		flex: 1;
	}
	.form-group.flex-2 {
		flex: 2;
	}

	.form-input {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.12));
		border-radius: 12px;
		padding: 10px 14px;
		color: var(--admin-text-primary);
		font-size: 13.5px;
		transition: all 0.2s ease;
		width: 100%;
	}

	.form-input:focus {
		border-color: var(--admin-accent, #d4af37);
		box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
		background: rgba(255, 255, 255, 0.08);
		outline: none;
	}

	/* Quick Badge Preset Chips */
	.quick-badge-chips {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		margin-top: -6px;
		margin-bottom: 18px;
	}

	.badge-chip {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.1));
		color: var(--admin-text-secondary);
		padding: 4px 10px;
		border-radius: 8px;
		font-size: 11.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.badge-chip:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--admin-text-primary);
	}

	.badge-chip.selected {
		background: rgba(212, 175, 55, 0.2);
		border-color: var(--admin-accent, #d4af37);
		color: var(--admin-accent, #d4af37);
		font-weight: 700;
	}

	/* Media Type Selector & Upload Dropzone */
	.media-selector-group {
		margin-bottom: 16px;
	}

	.media-toggle-buttons {
		display: flex;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.1));
		padding: 4px;
		border-radius: 12px;
		gap: 4px;
		margin-top: 4px;
	}

	.media-toggle-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px 14px;
		border-radius: 8px;
		border: none;
		background: transparent;
		color: var(--admin-text-secondary);
		font-size: 12.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.media-toggle-btn:hover {
		color: var(--admin-text-primary);
		background: rgba(255, 255, 255, 0.05);
	}

	.media-toggle-btn.active {
		background: linear-gradient(135deg, #d4af37 0%, #ff9f0a 100%);
		color: #000000;
		font-weight: 700;
		box-shadow: 0 3px 10px rgba(212, 175, 55, 0.3);
	}

	.image-media-controls,
	.emoji-media-controls {
		margin-bottom: 16px;
	}

	.upload-dropzone {
		display: block;
		background: rgba(212, 175, 55, 0.06);
		border: 2px dashed rgba(212, 175, 55, 0.3);
		border-radius: 12px;
		padding: 16px;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: 14px;
	}

	.upload-dropzone:hover {
		background: rgba(212, 175, 55, 0.12);
		border-color: var(--admin-accent, #d4af37);
	}

	.hidden-file-input {
		display: none;
	}

	.dropzone-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-size: 13px;
		color: var(--admin-text-primary);
	}

	/* Simulated & Mini Offer Cards with Full Cover Background Image */
	.simulated-offer-card.has-full-cover,
	.mini-offer-card.has-full-cover {
		min-height: 220px;
		height: auto;
		width: 100%;
		max-width: 280px;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		text-align: left;
		position: relative;
		padding: 16px;
	}

	.simulated-offer-card.has-full-cover h3,
	.mini-offer-card.has-full-cover .mini-title {
		color: #ffffff !important;
		text-shadow: 0 2px 6px rgba(0, 0, 0, 0.85);
		font-size: 17px;
		font-weight: 700;
	}

	.simulated-offer-card.has-full-cover p,
	.mini-offer-card.has-full-cover .mini-desc {
		color: rgba(255, 255, 255, 0.9) !important;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);
	}

	/* Asset Selector (Emojis & Photos) */
	.asset-selector-wrap {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 8px;
	}

	.emoji-palette,
	.image-presets-palette {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.palette-title {
		font-size: 11px;
		color: var(--admin-text-tertiary);
		font-weight: 600;
		min-width: 46px;
	}

	.emoji-list {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.emoji-btn {
		width: 30px;
		height: 30px;
		border-radius: 8px;
		border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.1));
		background: rgba(255, 255, 255, 0.04);
		font-size: 14px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.15s ease, background 0.15s ease;
	}

	.emoji-btn:hover,
	.emoji-btn.active {
		transform: scale(1.2);
		border-color: var(--admin-accent, #d4af37);
		background: rgba(212, 175, 55, 0.2);
	}

	.image-presets-list {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.img-preset-btn {
		width: 34px;
		height: 34px;
		border-radius: 8px;
		border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.1));
		overflow: hidden;
		padding: 0;
		background: rgba(255, 255, 255, 0.04);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.img-preset-btn img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.img-preset-btn:hover,
	.img-preset-btn.active {
		transform: scale(1.1);
		border-color: var(--admin-accent, #d4af37);
		box-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
	}

	/* Card Enable/Disable Toggle Switch */
	.card-enable-toggle {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
		user-select: none;
		margin-left: 6px;
		background: rgba(0, 0, 0, 0.05);
		padding: 3px 8px;
		border-radius: 20px;
		border: 1px solid rgba(0, 0, 0, 0.08);
	}

	.card-enable-toggle input {
		display: none;
	}

	.toggle-slider {
		width: 28px;
		height: 16px;
		background-color: #cbd5e1;
		border-radius: 16px;
		position: relative;
		transition: background-color 0.2s ease;
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background-color: #ffffff;
		top: 2px;
		left: 2px;
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	.card-enable-toggle input:checked + .toggle-slider {
		background-color: #22c55e;
	}

	.card-enable-toggle input:checked + .toggle-slider::before {
		transform: translateX(12px);
	}

	.toggle-status-text.active {
		color: #166534;
	}

	.toggle-status-text.disabled {
		color: #991b1b;
	}

	/* Mini Card Disabled Overlay */
	.mini-card-disabled-overlay {
		position: absolute;
		inset: 0;
		background: rgba(15, 23, 42, 0.85);
		backdrop-filter: blur(2px);
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}

	.disabled-badge-tag {
		background: #991b1b;
		color: #ffffff;
		font-size: 10px;
		font-weight: 900;
		padding: 5px 12px;
		border-radius: 8px;
		letter-spacing: 0.8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}

	/* --- Live Card Preview Column (External Section Header & Preview Box) --- */
	.card-preview-column {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.column-preview-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		background: #0369a1;
		border: 1.5px solid #38bdf8;
		color: #ffffff;
		font-size: 11px;
		font-weight: 900;
		letter-spacing: 1.2px;
		padding: 6px 14px;
		border-radius: 10px;
		width: 100%;
		text-transform: uppercase;
		box-shadow: 0 4px 12px rgba(3, 105, 161, 0.3);
	}

	.card-preview-side {
		background: #0f172a;
		border: 2.5px solid #334155;
		border-radius: 20px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15);
	}

	.card-preview-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 8px;
		width: 100%;
		flex-wrap: wrap;
	}

	.btn-card-discard-bottom {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: #ffffff;
		color: #dc2626;
		font-weight: 800;
		font-size: 12px;
		padding: 7px 14px;
		border-radius: 8px;
		border: 1.5px solid #ef4444;
		box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.btn-card-discard-bottom:hover {
		background: #fef2f2;
		color: #b91c1c;
		border-color: #dc2626;
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
		transform: translateY(-1px);
	}

	.btn-card-discard-bottom:active {
		transform: translateY(0);
	}

	.btn-card-save-bottom {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: linear-gradient(135deg, #d4af37 0%, #aa7c11 100%);
		color: #000000;
		font-weight: 800;
		font-size: 12px;
		padding: 7px 14px;
		border-radius: 8px;
		border: 1px solid rgba(255, 215, 0, 0.4);
		box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.btn-card-save-bottom:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(212, 175, 55, 0.4);
		background: linear-gradient(135deg, #ffd700 0%, #c59b27 100%);
	}

	.btn-card-save-bottom:active:not(:disabled) {
		transform: translateY(0);
	}

	.btn-card-save-bottom:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.mini-offer-card {
		width: 100%;
		max-width: 280px;
		min-height: 180px;
		height: auto;
		background: linear-gradient(145deg, #1c1c24 0%, #121218 100%);
		border: 2px solid #d4af37;
		border-radius: 16px;
		padding: 18px 14px;
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.mini-badge {
		position: absolute;
		top: 10px;
		right: 10px;
		font-size: 9.5px;
		font-weight: 900;
		padding: 4px 9px;
		border-radius: 10px;
		text-transform: uppercase;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
	}

	/* Badge Theme Styles */
	.badge-hot {
		background: linear-gradient(180deg, #ff4d4d 0%, #dc2626 100%);
		color: #ffffff;
		border: 1px solid #f87171;
		box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
	}

	.badge-festive {
		background: linear-gradient(180deg, #ffd700 0%, #d4af37 100%);
		color: #000000;
		border: 1px solid #ffe082;
		box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
	}

	.badge-student {
		background: linear-gradient(180deg, #38bdf8 0%, #0284c7 100%);
		color: #ffffff;
		border: 1px solid #7dd3fc;
		box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
	}

	.badge-vip {
		background: linear-gradient(180deg, #c084fc 0%, #9333ea 100%);
		color: #ffffff;
		border: 1px solid #e9d5ff;
		box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
	}

	.badge-default {
		background: linear-gradient(180deg, #4ade80 0%, #16a34a 100%);
		color: #ffffff;
		border: 1px solid #86efac;
		box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
	}

	.mini-icon {
		font-size: 2.2rem;
		margin-bottom: 6px;
		display: inline-block;
		filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));
	}

	.mini-img {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		object-fit: cover;
		border: 1.5px solid #d4af37;
	}

	.mini-title {
		font-family: var(--admin-font-display);
		font-size: 14.5px;
		font-weight: 900;
		color: #ffffff;
		margin-bottom: 6px;
		line-height: 1.3;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	.mini-desc {
		font-size: 12px;
		color: #cbd5e1;
		line-height: 1.4;
		margin-bottom: 10px;
		font-weight: 500;
		word-break: break-word;
		white-space: normal;
	}

	.mini-price {
		font-family: var(--admin-font-display);
		margin-bottom: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}

	.mini-old-price {
		text-decoration: line-through;
		color: #94a3b8;
		font-size: 12px;
		font-weight: 600;
	}

	.mini-new-price {
		font-size: 16px;
		font-weight: 900;
		color: #ffd700;
		text-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
	}

	.mini-sparkle {
		height: 1.5px;
		background: linear-gradient(90deg, transparent, #ffd700, transparent);
		margin: 14px 0 10px;
		opacity: 0.6;
	}

	.mini-tc {
		font-size: 10.5px;
		font-weight: 800;
		color: #ffffff;
		background: rgba(0, 0, 0, 0.6);
		border: 1.5px solid rgba(212, 175, 55, 0.7);
		border-radius: 8px;
		padding: 4px 12px;
		display: inline-block;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	/* --- LIVE SIMULATION MODE --- */
	.live-preview-container {
		background: #0d0d0e;
		border: 1px solid var(--admin-border);
		border-radius: 24px;
		padding: 24px;
		box-shadow: var(--admin-shadow-xl);
		display: flex;
		flex-direction: column;
		gap: 40px;
	}

	.preview-notice-bar {
		background: rgba(212, 175, 55, 0.1);
		border: 1px solid rgba(212, 175, 55, 0.25);
		border-radius: 14px;
		padding: 12px 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
		gap: 16px;
		flex-wrap: wrap;
	}

	.notice-left {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		color: var(--admin-text-primary);
	}

	.gold-icon {
		color: var(--admin-accent);
	}

	.simulated-ticker-wrap {
		background: linear-gradient(135deg, #9333ea, #db2777, #f43f5e);
		height: 36px;
		border-radius: 10px;
		overflow: hidden;
		display: flex;
		align-items: center;
		box-shadow: 0 4px 15px rgba(219, 39, 119, 0.4);
	}

	.simulated-ticker-track {
		display: flex;
		gap: 60px;
		white-space: nowrap;
		animation: simTicker 20s linear infinite;
		color: #ffffff;
		font-weight: 700;
		font-size: 14px;
		letter-spacing: 0.5px;
	}

	@keyframes simTicker {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-33.33%);
		}
	}

	.simulated-video-section {
		text-align: center;
	}

	.section-tag {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 1.5px;
		color: var(--admin-accent);
		margin-bottom: 12px;
	}

	.video-responsive-wrap {
		position: relative;
		padding-bottom: 42%;
		height: 0;
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
		border: 1px solid var(--admin-border);
	}

	.video-responsive-wrap iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.simulated-offers-section {
		padding: 0;
	}

	.simulated-section-header {
		text-align: center;
		margin-bottom: 32px;
	}

	.simulated-section-header h2 {
		font-family: var(--admin-font-display);
		font-size: 26px;
		font-weight: 800;
		color: #ffffff;
		display: inline-flex;
		align-items: center;
		gap: 10px;
	}

	.emoji-star {
		font-size: 20px;
	}

	.simulated-section-header p {
		color: var(--admin-text-secondary);
		font-size: 14px;
		margin-top: 4px;
	}

	.simulated-offers-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 24px;
	}

	.simulated-offer-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		padding: 28px 24px;
		position: relative;
		text-align: center;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
		transition: all 0.3s ease;
	}

	.simulated-offer-card.glow-hover:hover {
		transform: translateY(-6px);
		border-color: var(--admin-accent);
		box-shadow: 0 14px 40px rgba(212, 175, 55, 0.25);
	}

	.sim-badge {
		position: absolute;
		top: 16px;
		right: 16px;
		font-size: 11px;
		font-weight: 800;
		padding: 4px 12px;
		border-radius: 20px;
		text-transform: uppercase;
	}

	.sim-icon {
		font-size: 2.8rem;
		margin-bottom: 14px;
	}

	.sim-img-icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		object-fit: cover;
	}

	.simulated-offer-card h3 {
		font-family: var(--admin-font-display);
		font-size: 18px;
		font-weight: 700;
		color: #ffffff;
		margin-bottom: 8px;
	}

	.simulated-offer-card p {
		font-size: 13.5px;
		color: var(--admin-text-secondary);
		line-height: 1.5;
		margin-bottom: 20px;
	}

	.sim-price-bar {
		margin-bottom: 16px;
		font-family: var(--admin-font-display);
	}

	.sim-old-price {
		text-decoration: line-through;
		color: var(--admin-text-tertiary);
		font-size: 14px;
		margin-right: 8px;
	}

	.sim-new-price {
		font-size: 22px;
		font-weight: 800;
		color: var(--admin-accent);
	}

	.sim-sparkle-line {
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--admin-accent), transparent);
		margin: 16px 0;
		opacity: 0.4;
	}

	/* Bottom Right T&C Positioning */
	.sim-tc-btn,
	.mini-tc {
		position: absolute;
		bottom: 12px;
		right: 12px;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		color: rgba(255, 255, 255, 0.85);
		font-size: 11px;
		font-weight: 700;
		padding: 4px 10px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		z-index: 3;
	}

	.sim-tc-btn:hover,
	.mini-tc:hover {
		background: rgba(212, 175, 55, 0.25);
		border-color: var(--admin-accent);
		color: #ffffff;
	}

	.btn-open-cropper-trigger {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		margin-top: 8px;
		background: rgba(212, 175, 55, 0.12);
		border: 1px solid rgba(212, 175, 55, 0.3);
		color: var(--admin-accent, #d4af37);
		border-radius: 8px;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
		justify-content: center;
	}

	.btn-open-cropper-trigger:hover {
		background: rgba(212, 175, 55, 0.22);
		border-color: var(--admin-accent);
	}

	/* Interactive Image Cropper Modal */
	.cropper-modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(8px);
		z-index: 99999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.cropper-modal-card {
		width: 100%;
		max-width: 520px;
		background: #141416;
		border: 1px solid rgba(212, 175, 55, 0.3);
		border-radius: 24px;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.cropper-modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 18px 24px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.cropper-title-box {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.cropper-title-box h3 {
		font-size: 16px;
		font-weight: 700;
		color: #ffffff;
		margin: 0;
	}

	.btn-close-modal {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: var(--admin-text-secondary);
		border-radius: 8px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-close-modal:hover {
		background: rgba(255, 255, 255, 0.15);
		color: #ffffff;
	}

	.cropper-modal-body {
		padding: 20px 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.cropper-hint {
		font-size: 12.5px;
		color: var(--admin-text-secondary);
		margin: 0;
	}

	.resolution-info-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		padding: 10px 14px;
		flex-wrap: wrap;
	}

	.res-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
	}

	.res-label {
		color: #94a3b8;
		font-weight: 500;
	}

	.res-value.gold {
		color: #ffd700;
		font-weight: 800;
	}

	.res-value.cyan {
		color: #38bdf8;
		font-weight: 800;
	}

	.res-badge {
		font-size: 10px;
		font-weight: 800;
		padding: 2px 7px;
		border-radius: 6px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.res-badge.green {
		background: rgba(34, 197, 94, 0.2);
		color: #4ade80;
		border: 1px solid rgba(34, 197, 94, 0.4);
	}

	.res-badge.orange {
		background: rgba(249, 115, 22, 0.2);
		color: #fb923c;
		border: 1px solid rgba(249, 115, 22, 0.4);
	}

	.crop-viewport-wrapper {
		display: flex;
		justify-content: center;
	}

	.crop-viewport-box {
		width: 360px;
		height: 270px;
		border-radius: 16px;
		border: 2.5px dashed #d4af37;
		position: relative;
		overflow: hidden;
		cursor: grab;
		background: #090d16;
		box-shadow: inset 0 0 25px rgba(0, 0, 0, 0.95);
		user-select: none;
		touch-action: none;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.crop-viewport-box:active {
		cursor: grabbing;
	}

	.crop-target-img {
		max-width: none !important;
		max-height: none !important;
		object-fit: fill !important;
		flex-shrink: 0;
		transition: transform 0.05s ease-out;
		pointer-events: none;
	}

	.crop-grid-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		border: 1px solid rgba(212, 175, 55, 0.4);
	}

	.crop-aspect-badge {
		position: absolute;
		bottom: 8px;
		right: 8px;
		background: rgba(0, 0, 0, 0.7);
		color: #d4af37;
		font-size: 10px;
		font-weight: 800;
		padding: 2px 8px;
		border-radius: 6px;
		border: 1px solid rgba(212, 175, 55, 0.3);
	}

	.cropper-controls-bar {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 14px;
		padding: 14px 18px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.zoom-slider-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.zoom-label {
		font-size: 12px;
		font-weight: 700;
		color: var(--admin-text-primary);
		white-space: nowrap;
	}

	.zoom-btn {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(255, 255, 255, 0.06);
		color: #ffffff;
		font-weight: 800;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.zoom-btn:hover {
		background: rgba(212, 175, 55, 0.2);
		border-color: var(--admin-accent);
	}

	.slider-ruler-wrap {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.zoom-range-slider {
		accent-color: #d4af37;
		cursor: pointer;
		width: 100%;
	}

	.ruler-ticks {
		display: flex;
		justify-content: space-between;
		font-size: 9.5px;
		color: var(--admin-text-tertiary);
		padding: 0 2px;
	}

	.zoom-value-pill {
		font-size: 11.5px;
		font-weight: 800;
		color: #d4af37;
		background: rgba(212, 175, 55, 0.15);
		padding: 2px 8px;
		border-radius: 6px;
		min-width: 44px;
		text-align: center;
	}

	.cropper-reset-row {
		display: flex;
		justify-content: center;
	}

	.btn-reset-crop {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: none;
		color: var(--admin-text-tertiary);
		font-size: 11.5px;
		cursor: pointer;
		transition: color 0.15s ease;
	}

	.btn-reset-crop:hover {
		color: var(--admin-accent);
	}

	.cropper-modal-footer {
		padding: 16px 24px;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}

	.btn-crop-submit {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 9px 20px;
		background: linear-gradient(135deg, #d4af37 0%, #ff9f0a 100%);
		border: none;
		color: #000000;
		font-size: 13px;
		font-weight: 700;
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35);
	}

	.btn-crop-submit:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 18px rgba(212, 175, 55, 0.45);
	}

	/* --- Loaders --- */
	.spinner-sm {
		width: 16px;
		height: 16px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive Media Queries */
	@media (max-width: 1024px) {
		.card-split-layout {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 768px) {
		.offers-management-page {
			padding: 12px 6px 60px;
		}
		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}
		.offers-tab-container {
			margin-bottom: 18px;
		}
		.offers-segmented-tabs {
			width: 100%;
		}
		.tab-btn {
			flex: 1;
			justify-content: center;
			padding: 9px 12px;
		}
		.form-row {
			flex-direction: column;
			gap: 0;
		}
		.offers-studio-header {
			gap: 12px;
		}
		.studio-actions {
			flex-direction: column;
			align-items: stretch;
			gap: 12px;
		}
		.studio-search-bar {
			width: 100%;
			justify-content: space-between;
		}
		.search-box {
			flex: 1;
		}
		.search-box input {
			width: 100%;
		}
		.card-toolbar {
			flex-direction: column;
			align-items: flex-start;
			gap: 10px;
		}
		.card-toolbar-actions {
			width: 100%;
			justify-content: space-between;
		}
		.floating-dirty-bar {
			width: calc(100% - 24px);
			flex-direction: column;
			gap: 10px;
			text-align: center;
		}
		.widget-header-bar {
			padding: 16px;
		}
		.accordion-body {
			padding: 0 16px 20px;
		}
	}
	.field-title {
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: 6px;
	}

	.media-upload-area {
		border: 2px dashed rgba(100, 116, 139, 0.4);
		border-radius: 12px;
		padding: 32px 16px;
		background: rgba(100, 116, 139, 0.05);
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.media-upload-area:hover {
		border-color: rgba(212, 175, 55, 0.8);
		background: rgba(212, 175, 55, 0.1);
	}
</style>
