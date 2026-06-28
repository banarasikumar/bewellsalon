import { db } from '$lib/firebase';
import {
	collection,
	query,
	where,
	getDocs,
	updateDoc,
	doc,
	serverTimestamp,
	increment,
	getDoc
} from 'firebase/firestore';

export async function generateReferralCode(name: string): Promise<string> {
	// e.g. "BEU" + Name's first 3 letters + Random 3 alphanumerics
	const prefix = 'BEU';
	const namePart = (name || 'USR').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
	
	let isUnique = false;
	let code = '';
	
	while (!isUnique) {
		const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
		code = `${prefix}${namePart}${randomPart}`;
		
		const q = query(collection(db, 'users'), where('referralCode', '==', code));
		const snap = await getDocs(q);
		if (snap.empty) {
			isUnique = true;
		}
	}
	return code;
}

export async function validateReferralCode(code: string): Promise<string | null> {
	if (!code) return null;
	const q = query(collection(db, 'users'), where('referralCode', '==', code.toUpperCase()));
	const snap = await getDocs(q);
	
	if (snap.empty) {
		return null;
	}
	return snap.docs[0].id; // Return referrer's UID
}

export async function processRegistrationReferral(
	newUserId: string, 
	referrerId: string, 
	referrerReward: number, 
	refereeReward: number
) {
	// Give referrer the registration reward
	const referrerRef = doc(db, 'users', referrerId);
	await updateDoc(referrerRef, {
		beuCash: increment(referrerReward),
		referralEarnings: increment(referrerReward),
		referralsCount: increment(1)
	});

	// Give referee (new user) the signup bonus
	const refereeRef = doc(db, 'users', newUserId);
	await updateDoc(refereeRef, {
		beuCash: increment(refereeReward)
	});
}
