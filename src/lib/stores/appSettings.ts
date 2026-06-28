import { writable, get } from 'svelte/store';
import { db } from '$lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export interface AppSettings {
	defaultPaymentGateway: 'default' | 'razorpay';
	totalChairs: number;
	promoTickerText: string;
	specialOffers: Array<{
		id: number;
		badge: string;
		icon: string;
		title: string;
		desc: string;
		oldPrice: string;
		newPrice: string;
	}>;
	promoVideoUrl: string;
	promoVideoEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
	defaultPaymentGateway: 'default',
	totalChairs: 3,
	promoTickerText: '✨ FESTIVE SPECIAL: Get 15% OFF on all Premium Beauty Packages this week! Tap to book now. ✨',
	specialOffers: [
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
	],
	promoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder default video
	promoVideoEnabled: false
};

export const appSettings = writable<AppSettings>(DEFAULT_SETTINGS);

let settingsUnsub: (() => void) | null = null;

export function initAppSettingsListener() {
	if (settingsUnsub) return;

	console.log('[AppSettings] Starting listener');
	const settingsRef = doc(db, 'settings', 'global');

	settingsUnsub = onSnapshot(
		settingsRef,
		(docSnapshot) => {
			if (docSnapshot.exists()) {
				appSettings.set({ ...DEFAULT_SETTINGS, ...docSnapshot.data() } as AppSettings);
			} else {
				// If it doesn't exist, set default
				setDoc(settingsRef, DEFAULT_SETTINGS).catch(console.error);
				appSettings.set(DEFAULT_SETTINGS);
			}
		},
		(error) => {
			console.error('[AppSettings] Listener error:', error);
		}
	);
}

export function destroyAppSettingsListener() {
	if (settingsUnsub) {
		settingsUnsub();
		settingsUnsub = null;
	}
}

export async function updateAppSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
	const settingsRef = doc(db, 'settings', 'global');
	try {
		await setDoc(settingsRef, { [key]: value }, { merge: true });
		// Store will auto-update via snapshot listener
		return true;
	} catch (error) {
		console.error(`[AppSettings] Failed to update ${key}:`, error);
		return false;
	}
}
