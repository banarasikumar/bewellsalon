import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebaseAdmin';

export async function GET() {
	try {
		const snapshot = await adminDb
			.collection('users')
			.where('role', 'in', ['staff', 'admin'])
			.get();

		const staffList: any[] = [];
		snapshot.forEach((doc) => {
			const data = doc.data();
			const name = data.name || data.displayName;
			if (data.accountStatus !== 'merged' && name && data.onService === true) {
				staffList.push({
					id: doc.id,
					name: name,
					specialty: data.specialty || '',
					photoURL: data.photoURL || data.photo || data.avatar || data.image || '',
					role: data.specialty || data.role || 'Staff'
				});
			}
		});

		return json({ staff: staffList });
	} catch (error: any) {
		console.error('API /api/staff error:', error);
		return json({ error: error.message }, { status: 500 });
	}
}

