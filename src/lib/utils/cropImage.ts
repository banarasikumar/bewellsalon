/**
 * Creates an HTML Image element from a source string (URL or base64)
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener('load', () => resolve(image));
		image.addEventListener('error', (error) => reject(error));
		image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid CORS issues with canvas
		image.src = url;
	});

export interface PixelCrop {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Crops an image based on the pixel crop coordinates and resizes it to target dimension,
 * returning a WebP Blob.
 */
export default async function getCroppedImg(
	imageSrc: string,
	pixelCrop: PixelCrop,
	targetWidth = 1024,
	targetHeight = 1024
): Promise<Blob> {
	const image = await createImage(imageSrc);
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error('No 2d context');
	}

	// Set canvas size to the target final size
	canvas.width = targetWidth;
	canvas.height = targetHeight;

	// Draw the cropped area of the image, resized to fit the canvas target dimensions
	ctx.drawImage(
		image,
		pixelCrop.x,
		pixelCrop.y,
		pixelCrop.width,
		pixelCrop.height,
		0,
		0,
		targetWidth,
		targetHeight
	);

	// Export as WebP Blob with 0.8 quality
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error('Canvas is empty'));
					return;
				}
				resolve(blob);
			},
			'image/webp',
			0.8
		);
	});
}
