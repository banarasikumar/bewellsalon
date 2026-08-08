import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebaseAdmin';
import admin from 'firebase-admin';

// Define a secret key. In production, use process.env.CRON_SECRET
// For Vercel, you would add this to Environment Variables
const CRON_SECRET = 'e293136c-2650-4fb6-82be-15c34c261161';

export async function POST({ request }) {
	// 1. Security Check
	const authHeader = request.headers.get('authorization');
	if (authHeader !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		console.log('[API] Starting auto-cancellation cleanup...');
		const now = Date.now();
		const thirtyMinutes = 30 * 60 * 1000;

		// 2. Query Pending Bookings using Admin SDK
		const snapshot = await adminDb.collection('bookings').where('status', '==', 'pending').get();

		const overdueBookings = [];

		snapshot.forEach((doc) => {
			const data = doc.data();

			// Helper to get timestamp
			let ts = 0;
			if (data.date) {
				if (data.date.seconds) {
					ts = data.date.seconds * 1000;
				} else if (typeof data.date === 'string' && data.date.includes('-')) {
					const parts = data.date.split('-');
					if (parts.length === 3) {
						let d: Date;
						if (parts[0].length === 4) {
							// YYYY-MM-DD
							d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
						} else if (parts[2].length === 4) {
							// DD-MM-YYYY
							d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
						} else {
							d = new Date(data.date);
						}
						if (data.time && typeof data.time === 'string') {
							const [tPart, mod] = data.time.trim().split(' ');
							if (tPart) {
								let [h, m] = tPart.split(':').map(Number);
								if (!isNaN(h) && !isNaN(m)) {
									if (mod) {
										const mUpper = mod.toUpperCase();
										if (mUpper === 'PM' && h < 12) h += 12;
										if (mUpper === 'AM' && h === 12) h = 0;
									}
									d.setHours(h, m, 0, 0);
								}
							}
						}
						ts = d.getTime();
					}
				}
				if (!ts) ts = new Date(data.date).getTime();
			}
			if (!ts && data.createdAt) {
				ts = data.createdAt.seconds
					? data.createdAt.seconds * 1000
					: new Date(data.createdAt).getTime();
			}

			// Check if overdue (Appointment Time + 30 Minutes <= Now)
			if (ts + thirtyMinutes <= now) {
				overdueBookings.push(doc.id);
			}
		});

		console.log(`[API] Found ${overdueBookings.length} overdue bookings.`);

		// 3. Batch Update
		let cancelledCount = 0;
		const updatePromises = overdueBookings.map(async (id) => {
			try {
				await adminDb.collection('bookings').doc(id).update({
					status: 'cancelled',
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
					cancelledBy: 'system-cron'
				});
				cancelledCount++;
			} catch (err) {
				console.error(`[API] Failed to cancel booking ${id}:`, err);
			}
		});

		await Promise.all(updatePromises);

		return json({
			success: true,
			message: `Cancelled ${cancelledCount} overdue bookings`,
			processed: overdueBookings.length
		});
	} catch (error) {
		console.error('[API] Error in cleanup-bookings:', error);
		return json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
	}
}
