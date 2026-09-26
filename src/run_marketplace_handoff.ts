import { mkdir, writeFile } from 'node:fs/promises';
import { prepareMarketplaceVideoHandoff } from './marketplace_video_handoff';

async function ensureDemoImage(): Promise<string> {
  const dir = new URL('../tmp/', import.meta.url);
  await mkdir(dir, { recursive: true });
  const fileUrl = new URL('demo-hero.jpg', dir);
  const onePixelJpeg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBAVFRUVFRUVFRUVFRUVFRUVFRUXFhUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGi0fHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAXAAEBAQEAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIQAxAAAAHhAH//xAAVEAEBAAAAAAAAAAAAAAAAAAAAEf/aAAgBAQABBQJf/8QAFBEBAAAAAAAAAAAAAAAAAAAAEP/aAAgBAwEBPwEf/8QAFBEBAAAAAAAAAAAAAAAAAAAAEP/aAAgBAgEBPwEf/8QAFBABAAAAAAAAAAAAAAAAAAAAEP/aAAgBAQAGPwJf/8QAFBABAAAAAAAAAAAAAAAAAAAAEP/aAAgBAQABPyFf/9k=', 'base64');
  await writeFile(fileUrl, onePixelJpeg);
  return fileUrl.pathname;
}

async function main(): Promise<void> {
  const heroPath = await ensureDemoImage();

  const handoff = await prepareMarketplaceVideoHandoff({
    orderId: 'ord_1001',
    sellerId: 'seller_77',
    buyerFirstName: 'Maya',
    listingTitle: 'Handwoven ceramic mug',
    listingCategory: 'Home goods',
    keySellingPoints: ['matte glaze', 'hand-finished handle'],
    assets: [
      { localPath: heroPath, filename: 'mug-hero.jpg', role: 'hero' },
      { localPath: heroPath, filename: 'mug-detail.jpg', role: 'detail' }
    ],
    aspectRatio: '9:16',
    durationSeconds: 5
  });

  console.log(JSON.stringify(handoff, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
