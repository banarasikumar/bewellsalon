import { writable, derived } from 'svelte/store';
import {
	onAuthStateChanged,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	signInWithCredential
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '$lib/firebase';
import type { User } from 'firebase/auth';

export type AdminAuthState = 'loading' | 'unauthenticated' | 'checking' | 'authorized' | 'denied';

// Super admin emails that automatically get admin role
const SUPER_ADMINS = [
	'banarasikumarsahu@gmail.com',
	'banz3949@gmail.com',
	'blancbeu07@gmail.com',
	'rinak2645@gmail.com'
];

// Super admin phone numbers that automatically get admin role
const SUPER_ADMIN_PHONES = ['+919798222154', '+917004574629'];

export const adminUser = writable<User | null>(null);
export const adminAuthState = writable<AdminAuthState>('loading');
export const isAdmin = derived(adminAuthState, ($state) => $state === 'authorized');

let unsubscribeAuth: (() => void) | null = null;

// Timeout wrapper for promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) =>
			setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
		)
	]);
}

function normalizePhoneDigits(phone: string): string {
	return phone.replace(/\D/g, '').slice(-10);
}

/**
 * Search Firestore for a placeholder user doc created manually by email or phone,
 * and link its admin role to the logged in user's Firebase Auth UID.
 */
async function findAndLinkPlaceholderAdminRole(
	uid: string,
	email: string | null,
	phone: string | null
): Promise<boolean> {
	try {
		const usersRef = collection(db, 'users');

		// 1. Try matching by Email if available
		if (email && email.trim()) {
			const cleanEmail = email.trim().toLowerCase();
			const emailQuery = query(usersRef, where('email', '==', cleanEmail));
			const snap = await getDocs(emailQuery);

			for (const d of snap.docs) {
				if (d.id === uid) continue;
				const data = d.data();
				if (data.role === 'admin' && data.accountStatus !== 'merged') {
					console.log(`[AdminAuth] Found matching placeholder admin profile by email (${cleanEmail})`);
					await linkAdminPlaceholderToUid(uid, d.id, data, email, phone);
					return true;
				}
			}
		}

		// 2. Try matching by Phone if available
		const targetPhone = phone || (uid.startsWith('wa:') ? uid.replace('wa:', '') : auth.currentUser?.phoneNumber || null);
		if (targetPhone) {
			const digits = normalizePhoneDigits(targetPhone);
			if (digits.length === 10) {
				const phoneFormats = [digits, `+91${digits}`, `+91 ${digits}`];
				for (const fmt of phoneFormats) {
					const phoneQuery = query(usersRef, where('phone', '==', fmt));
					const snap = await getDocs(phoneQuery);

					for (const d of snap.docs) {
						if (d.id === uid) continue;
						const data = d.data();
						if (data.role === 'admin' && data.accountStatus !== 'merged') {
							console.log(`[AdminAuth] Found matching placeholder admin profile by phone (${fmt})`);
							await linkAdminPlaceholderToUid(uid, d.id, data, email, targetPhone);
							return true;
						}
					}
				}
			}
		}

		return false;
	} catch (err) {
		console.error('[AdminAuth] Error searching placeholder admin profiles:', err);
		return false;
	}
}

async function linkAdminPlaceholderToUid(
	uid: string,
	placeholderId: string,
	placeholderData: any,
	userEmail: string | null,
	userPhone: string | null
) {
	const userDocRef = doc(db, 'users', uid);
	await setDoc(
		userDocRef,
		{
			role: 'admin',
			displayName: placeholderData.displayName || placeholderData.name || '',
			name: placeholderData.name || placeholderData.displayName || '',
			specialty: placeholderData.specialty || '',
			email: userEmail || placeholderData.email || '',
			phone: userPhone || placeholderData.phone || '',
			accountType: 'user',
			linkedFromPlaceholderId: placeholderId,
			updatedAt: new Date().toISOString()
		},
		{ merge: true }
	);

	await updateDoc(doc(db, 'users', placeholderId), {
		accountStatus: 'merged',
		mergedIntoUid: uid,
		mergedAt: new Date().toISOString()
	}).catch((e) => console.warn('[AdminAuth] Could not mark placeholder as merged:', e));
}

/**
 * Verify if a user has admin role in Firestore
 */
async function verifyAdminRole(uid: string, email: string | null): Promise<boolean> {
	console.log('[AdminAuth] Starting admin role verification for:', email || uid);

	// Extract phone from uid if user logged in via WhatsApp or phone auth
	const phone = uid.startsWith('wa:') ? uid.replace('wa:', '') : auth.currentUser?.phoneNumber || null;

	// Fast path: grant access immediately if email/phone is in the super admin list.
	// Firestore promotion runs in the background so a DB error never blocks login.
	if (email && SUPER_ADMINS.includes(email.toLowerCase())) {
		const docRef = doc(db, 'users', uid);
		setDoc(docRef, { email, role: 'admin' }, { merge: true }).catch((e) =>
			console.error('[AdminAuth] Background admin promotion failed:', e)
		);
		console.log('[AdminAuth] Super admin email match - access granted');
		return true;
	}

	if (phone && SUPER_ADMIN_PHONES.includes(phone)) {
		const docRef = doc(db, 'users', uid);
		setDoc(docRef, { phone, role: 'admin' }, { merge: true }).catch((e) =>
			console.error('[AdminAuth] Background admin promotion failed:', e)
		);
		console.log('[AdminAuth] Super admin phone match - access granted');
		return true;
	}

	// Check existing role in Firestore (for non-super-admins)
	try {
		const docRef = doc(db, 'users', uid);
		const docSnap = await withTimeout(getDoc(docRef), 10000, 'Firestore getDoc');

		if (docSnap.exists()) {
			const data = docSnap.data();
			if (data.role === 'admin') {
				console.log('[AdminAuth] User has admin role in DB - access granted');
				return true;
			}
		}

		// Fallback path: search for placeholder admin profile created manually by admin
		const linked = await findAndLinkPlaceholderAdminRole(uid, email, phone);
		if (linked) return true;

		console.log('[AdminAuth] No admin role found - access denied');
		return false;
	} catch (e: any) {
		console.error('[AdminAuth] Error checking admin role:', e.message);
		return false;
	}
}

/**
 * Initialize admin auth listener
 */
export async function initAdminAuth() {
	if (unsubscribeAuth) return; // Already initialized

	console.log('[AdminAuth] Initializing auth listener...');
	const initStartTime = performance.now();

	// Use authStateReady() for faster initialization (Firebase 9.22+)
	// This resolves immediately when auth state is known
	try {
		await withTimeout((auth as any).authStateReady(), 15000, 'Auth state ready');
		const user = auth.currentUser;
		const timeToReady = (performance.now() - initStartTime).toFixed(2);
		console.log(
			`[AdminAuth] Auth state ready after ${timeToReady}ms, user:`,
			user?.email || user?.uid || 'null'
		);

		if (user) {
			adminUser.set(user);
			adminAuthState.set('checking');

			const hasAccess = await verifyAdminRole(user.uid, user.email);
			if (hasAccess) {
				adminAuthState.set('authorized');
			} else {
				adminAuthState.set('denied');
				if (Capacitor.isNativePlatform()) {
					try {
						await FirebaseAuthentication.signOut();
					} catch (e) {
						console.warn('[AdminAuth] Native FirebaseAuthentication.signOut error:', e);
					}
				}
				await signOut(auth);
				adminUser.set(null);
			}
		} else {
			adminUser.set(null);
			adminAuthState.set('unauthenticated');
		}
	} catch (timeoutError) {
		console.error('[AdminAuth] Auth initialization timeout:', timeoutError);
		adminAuthState.set('unauthenticated');
	}

	// Set up listener for future auth state changes
	unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
		console.log('[AdminAuth] Auth state changed, user:', user?.email || user?.uid || 'null');

		if (user) {
			adminUser.set(user);
			adminAuthState.set('checking');

			const hasAccess = await verifyAdminRole(user.uid, user.email);
			if (hasAccess) {
				adminAuthState.set('authorized');
			} else {
				adminAuthState.set('denied');
				if (Capacitor.isNativePlatform()) {
					try {
						await FirebaseAuthentication.signOut();
					} catch (e) {
						console.warn('[AdminAuth] Native FirebaseAuthentication.signOut error:', e);
					}
				}
				await signOut(auth);
				adminUser.set(null);
			}
		} else {
			adminUser.set(null);
			adminAuthState.set('unauthenticated');
		}
	});
}

/**
 * Sign in with Google
 */
export async function adminSignIn(): Promise<void> {
	const provider = new GoogleAuthProvider();
	provider.setCustomParameters({ prompt: 'select_account' });
	try {
		if (Capacitor.isNativePlatform()) {
			console.log('[AdminAuth] Triggering Native Android Google Sign-In...');
			const result = await FirebaseAuthentication.signInWithGoogle();
			const idToken = result.credential?.idToken;
			if (idToken) {
				const credential = GoogleAuthProvider.credential(idToken);
				await signInWithCredential(auth, credential);
			} else {
				throw new Error('Native authentication returned empty ID token.');
			}
		} else {
			console.log('[AdminAuth] Triggering Desktop Web Google Sign-In...');
			await signInWithPopup(auth, provider);
		}
		// Auth state change will handle the rest
	} catch (error: any) {
		console.error('[AdminAuth] Login failed:', error);
		throw error;
	}
}

/**
 * Sign out
 */
export async function adminLogout(): Promise<void> {
	try {
		if (Capacitor.isNativePlatform()) {
			try {
				await FirebaseAuthentication.signOut();
			} catch (e) {
				console.warn('[AdminAuth] Native FirebaseAuthentication.signOut error:', e);
			}
		}
		await signOut(auth);
		adminUser.set(null);
		adminAuthState.set('unauthenticated');
	} catch (error: any) {
		console.error('[AdminAuth] Logout failed:', error);
		throw error;
	}
}

/**
 * Cleanup
 */
export function destroyAdminAuth() {
	if (unsubscribeAuth) {
		unsubscribeAuth();
		unsubscribeAuth = null;
	}
}
