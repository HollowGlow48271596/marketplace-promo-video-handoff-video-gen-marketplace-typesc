import { describe, expect, it } from 'vitest';
import { decideOrderStage, marketplaceVideoRequestSchema } from '../src/marketplace_video_handoff';

describe('decideOrderStage', () => {
  it('asks for more seller assets when the listing only has one image', () => {
    const input = marketplaceVideoRequestSchema.parse({
      orderId: 'ord_missing_assets',
      sellerId: 'seller_12',
      buyerFirstName: 'Lena',
      listingTitle: 'Vintage brass lamp',
      listingCategory: 'Lighting',
      keySellingPoints: ['warm finish', 'compact footprint'],
      assets: [
        { localPath: '/tmp/lamp-hero.jpg', filename: 'lamp-hero.jpg', role: 'hero' }
      ],
      aspectRatio: '9:16',
      durationSeconds: 5
    });

    const result = decideOrderStage(input);

    expect(result.stage).toBe('needs_seller_assets');
    expect(result.buyerUpdate).toBe('Need at least 2 images for a short marketplace promo video.');
  });
});
