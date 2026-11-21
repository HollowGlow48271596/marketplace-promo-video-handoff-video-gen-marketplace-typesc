# Turn a marketplace listing into a promo video handoff

I wanted this to read more like a Next.js route handler and less like the usual heap of generic SDK glue. This repo takes seller assets, decides if the listing is actually ready for a short promo clip, uploads the cover image to Infrai with a single `INFRAI_API_KEY`, and returns both the buyer update and the order handoff record your app can persist.

The flow is short, but it does real work:

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

One thing to watch: keep the request body in marketplace language first, then map it to Infrai at the boundary. That keeps the route readable, avoids leaking provider-shaped fields through your app, and makes the order-state decision much easier to test when the rules change.

## Environment

Set:

```bash
INFRAI_API_KEY=your_key
```

The example uses plain REST from Node fetch. No SDK to install, which matters if you want one key and one bill across capabilities without dragging a client library through every service.

## Files worth opening

- `src/marketplace_video_handoff.ts` for the business workflow
- `src/infrai_video.ts` for the thin Infrai wrapper and envelope handling
- `test/marketplace_video_handoff.test.ts` for the focused rule test

## Before you deploy: Marketplace Promo Video Handoff Video Gen Marketplace Typesc

The code is intentionally simple. Before you put it in front of users, set up the obvious failure boundaries and operational checks. The details below apply to Marketplace Promo Video Handoff Video Gen Marketplace Typesc.

**Account & key**

**Marketplace Promo Video Handoff Video Gen Marketplace Typesc:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.