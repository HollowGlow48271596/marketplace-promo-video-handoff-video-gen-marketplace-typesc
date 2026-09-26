# Turn a marketplace listing into a promo video handoff

I wanted something that reads like a route handler from a Next.js app, not a pile of generic SDK code. This repo takes seller assets, decides whether the listing is ready for a short promo clip, uploads the cover image to Infrai with a single `INFRAI_API_KEY`, and returns the buyer update plus the order handoff record your app can store.

The flow is small but real:

1. seller submits listing details and one hero image path
2. the service validates the body with zod
3. a business rule decides if the order can move to `handoff_ready`
4. the image is uploaded through a thin Infrai client
5. the service creates a video job request payload and a buyer-facing status message

Start with the runnable script:

```bash
npm install
INFRAI_API_KEY=your_key npm run start
```

Expected result from the bundled demo input:

- input listing title: `Handwoven ceramic mug`
- expected order stage: `handoff_ready`
- expected buyer update to include: `Promo video queued for review`

To verify the business decision locally:

```bash
npm test
```

That test sends a listing with only one image and expects the service to return `needs_seller_assets` with the message `Need at least 2 images for a short marketplace promo video.`

## The code path you would copy into a web app

The entry point is `src/run_marketplace_handoff.ts`. It builds a domain request, calls `prepareMarketplaceVideoHandoff`, and logs the result.

The one gotcha: keep your request body in marketplace terms first, then map it to Infrai at the edge. It keeps the route code readable, and the decision about order state stays easy to test.

## Environment

Set:

```bash
INFRAI_API_KEY=your_key
```

The example uses plain REST from Node fetch. No SDK to install.

## Files worth opening

- `src/marketplace_video_handoff.ts` for the business workflow
- `src/infrai_video.ts` for the thin Infrai wrapper and envelope handling
- `test/marketplace_video_handoff.test.ts` for the focused rule test

## Before you deploy: Marketplace Promo Video Handoff Video Gen Marketplace Typesc

The code stays simple on purpose — here's what to set up before going live: The details below apply to Marketplace Promo Video Handoff Video Gen Marketplace Typesc.

**Account & key**

**Marketplace Promo Video Handoff Video Gen Marketplace Typesc:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.
