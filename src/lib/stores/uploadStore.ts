import { writable } from 'svelte/store';
import { db } from '$lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { upload } from '@vercel/blob/client';

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'error';

export interface UploadTaskItem {
	id: string;
	fileName: string;
	progress: number;
	status: UploadStatus;
	error?: string;
	downloadUrl?: string;
	type: 'image' | 'file';
}

function createUploadStore() {
	const { subscribe, set, update } = writable<UploadTaskItem[]>([]);

	return {
		subscribe,
		addUpload: (
			file: File,
			storagePath: string, // Kept for API compatibility, though Vercel Blob handles naming automatically
			docPathToUpdate: string,
			fieldToUpdate: string,
			onComplete?: (url: string) => void
		) => {
			const id = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
			const newItem: UploadTaskItem = {
				id,
				fileName: file.name,
				progress: 0,
				status: 'pending',
				type: file.type.startsWith('image/') ? 'image' : 'file'
			};

			update((items) => [newItem, ...items]);
			update((items) => items.map((item) => (item.id === id ? { ...item, status: 'uploading' } : item)));

			// Start the upload asynchronously
			(async () => {
				try {
					const newBlob = await upload(file.name, file, {
						access: 'public',
						handleUploadUrl: '/api/upload',
						onUploadProgress: (progressEvent) => {
							update((items) => 
								items.map((item) => (item.id === id ? { ...item, progress: progressEvent.percentage } : item))
							);
						}
					});

					// Update firestore document
					if (docPathToUpdate) {
						await updateDoc(doc(db, docPathToUpdate), {
							[fieldToUpdate]: newBlob.url,
							isActive: true // Make active when image is uploaded successfully
						});
					}

					update((items) =>
						items.map((item) =>
							item.id === id ? { ...item, status: 'completed', progress: 100, downloadUrl: newBlob.url } : item
						)
					);

					if (onComplete) onComplete(newBlob.url);
				} catch (err: any) {
					console.error('[UploadStore] Upload failed:', err);
					const userMessage = err.message || 'An error occurred while uploading.';
					
					import('$lib/stores/toast').then(({ showToast }) => {
						showToast(userMessage, 'error');
					});

					update((items) =>
						items.map((item) =>
							item.id === id ? { ...item, status: 'error', error: userMessage } : item
						)
					);
				}
			})();

			return id;
		},
		removeUpload: (id: string) => update((items) => items.filter((item) => item.id !== id)),
		clearCompleted: () => update((items) => items.filter((item) => item.status !== 'completed'))
	};
}

export const uploadStore = createUploadStore();

