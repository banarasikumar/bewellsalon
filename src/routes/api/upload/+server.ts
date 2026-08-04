import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BLOB_READ_WRITE_TOKEN } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as HandleUploadBody;

	try {
		const jsonResponse = await handleUpload({
			body,
			request,
			token: BLOB_READ_WRITE_TOKEN,
			onBeforeGenerateToken: async (pathname) => {
				// In a full production app, you would verify the user's session token here
				// to ensure only admins can upload files. For now, we allow image uploads.
				return {
					allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
					tokenPayload: JSON.stringify({
						// Optional payload
					})
				};
			},
			onUploadCompleted: async ({ blob }) => {
				console.log('Blob upload completed', blob.url);
				// The client-side code will handle updating the Firestore document
				// with this newly uploaded image URL.
			}
		});

		return json(jsonResponse);
	} catch (error) {
		return json(
			{ error: (error as Error).message },
			{ status: 400 }
		);
	}
};
