import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { infraiVideo } from './infrai_video';

const sellerAssetSchema = z.object({
  localPath: z.string().min(1),
  filename: z.string().min(1),
  role: z.enum(['hero', 'detail'])
});

export const marketplaceVideoRequestSchema = z.object({
  orderId: z.string().min(1),
  sellerId: z.string().min(1),
  buyerFirstName: z.string().min(1),
  listingTitle: z.string().min(3),
  listingCategory: z.string().min(2),
  keySellingPoints: z.array(z.string().min(2)).min(2).max(4),
  assets: z.array(sellerAssetSchema).min(1),
  aspectRatio: z.enum(['9:16', '16:9']).default('9:16'),
  durationSeconds: z.union([z.literal(5), z.literal(10)]).default(5)
});

export type MarketplaceVideoRequest = z.infer<typeof marketplaceVideoRequestSchema>;

export type MarketplaceVideoHandoff = {
  orderId: string;
  sellerId: string;
  stage: 'needs_seller_assets' | 'handoff_ready';
  buyerUpdate: string;
  promoPrompt?: string;
  videoJob?: {
    provider: 'infrai';
    requestId: string;
    status: 'queued';
    sourceImageId: string;
  };
};

export function decideOrderStage(input: MarketplaceVideoRequest): MarketplaceVideoHandoff {
  const heroAssets = input.assets.filter((asset) => asset.role === 'hero');

  if (input.assets.length < 2) {
    return {
      orderId: input.orderId,
      sellerId: input.sellerId,
      stage: 'needs_seller_assets',
      buyerUpdate: 'Need at least 2 images for a short marketplace promo video.'
    };
  }

  if (heroAssets.length !== 1) {
    return {
      orderId: input.orderId,
      sellerId: input.sellerId,
      stage: 'needs_seller_assets',
      buyerUpdate: 'Add exactly 1 hero image so the promo video starts on the main product shot.'
    };
  }

  return {
    orderId: input.orderId,
    sellerId: input.sellerId,
    stage: 'handoff_ready',
    buyerUpdate: `Promo video queued for review for ${input.buyerFirstName}.`
  };
}

function buildPromoPrompt(input: MarketplaceVideoRequest): string {
  const sellingPoints = input.keySellingPoints.join(', ');
  return `Create a short marketplace promo video for ${input.listingTitle} in ${input.listingCategory}. Show the product clearly, keep motion simple, and highlight: ${sellingPoints}. End on a clean product beauty shot suitable for a buyer update.`;
}

function createRequestId(input: MarketplaceVideoRequest): string {
  return createHash('sha256')
    .update(JSON.stringify({
      orderId: input.orderId,
      sellerId: input.sellerId,
      listingTitle: input.listingTitle,
      assets: input.assets.map((asset) => ({ filename: asset.filename, role: asset.role }))
    }))
    .digest('hex')
    .slice(0, 16);
}

export async function prepareMarketplaceVideoHandoff(rawInput: unknown): Promise<MarketplaceVideoHandoff> {
  const input = marketplaceVideoRequestSchema.parse(rawInput);
  const decision = decideOrderStage(input);

  if (decision.stage === 'needs_seller_assets') {
    return decision;
  }

  const heroAsset = input.assets.find((asset) => asset.role === 'hero');
  if (!heroAsset) {
    return {
      orderId: input.orderId,
      sellerId: input.sellerId,
      stage: 'needs_seller_assets',
      buyerUpdate: 'Add exactly 1 hero image so the promo video starts on the main product shot.'
    };
  }

  const imageBuffer = await readFile(heroAsset.localPath);
  const upload = await infraiVideo.generatePromoVideo({
    file: imageBuffer,
    filename: heroAsset.filename
  });

  const requestId = createRequestId(input);
  const promoPrompt = buildPromoPrompt(input);

  return {
    orderId: input.orderId,
    sellerId: input.sellerId,
    stage: 'handoff_ready',
    buyerUpdate: `Promo video queued for review for ${input.buyerFirstName}.`,
    promoPrompt,
    videoJob: {
      provider: 'infrai',
      requestId,
      status: 'queued',
      sourceImageId: upload.id
    }
  };
}
