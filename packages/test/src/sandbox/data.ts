import { getCoreStoreIdentifiers } from '@core/index'
import { Account, AccountSession, Discovery, DiscoveryMode, PreviewMode, ScanEvent, Spot, Trail, TrailSpot } from '@shared/contracts'

interface DataSchema<T> {
  id: string
  fileName: string
  data: T
}

interface SandboxDataSet {
  account: DataSchema<Account>
  trails: DataSchema<Trail[]>
  spots: DataSchema<Spot[]>
  trailSpots: DataSchema<TrailSpot[]>
  discoveries: DataSchema<Discovery[]>
  scanEvents: DataSchema<ScanEvent[]>
}

// Constants for reuse
const DEFAULT_USER_ID = 'clx4j9k2n000001mh3g2h4f7p'
const NOW = new Date()
const YESTERDAY = new Date(NOW.getTime() - 24 * 60 * 60 * 1000)
const LAST_WEEK = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000)
const STORES = getCoreStoreIdentifiers()

export const ACCOUNT_SESSION: AccountSession = {
  id: DEFAULT_USER_ID,
  accountId: DEFAULT_USER_ID,
  expiresAt: new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  sessionToken: 'session_token_example',
  accountType: 'sms_verified',
}

const jsonFile = (id: string) => `${id}.json`

const sandboxData: SandboxDataSet = {
  account: {
    id: STORES.ACCOUNTS,
    fileName: jsonFile(STORES.ACCOUNTS),
    data: {
      id: DEFAULT_USER_ID,
      createdAt: LAST_WEEK,
      phoneHash: 'hashed_phone_number',
      accountType: 'sms_verified',
      isPhoneVerified: false,
    },
  },
  trails: {
    id: STORES.TRAILS,
    fileName: jsonFile(STORES.TRAILS),
    data: [
      {
        id: 'clx4j9k2n000101mh8d4k9n2q',
        name: 'Discovery Trail',
        slug: 'discovery-trail-2025',
        description: 'Free exploration of interesting spots in your area',
        spots: [],
        map: {
          image:
            'https://stferthecore.blob.core.windows.net/resources/discovery-bg-1.png?sp=r&st=2025-06-15T21:13:41Z&se=2025-07-05T05:13:41Z&spr=https&sv=2024-11-04&sr=b&sig=dOGCg%2B%2Fwm7LxUTRM0BLZMx076CYT8cph6Zh5eNGbw14%3D',
        },
        options: {
          scannerRadius: 250,
          discoveryMode: 'free' as DiscoveryMode,
          previewMode: 'preview' as PreviewMode,
        },
        image: {
          id: 'clx4j9k2n000101mh8d4k9n2q',
          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: NOW,
      },
      {
        id: 'cmc35a2qc12ome60777f19f2b',
        name: 'Ascheberg Kirmes Trail',
        slug: 'ascheberg-kirmes-trail-8010',
        description: '',
        map: {
          image:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/ascheberg-kirmes-trail-8010-map.png?sp=r&st=2025-06-19T12:01:23Z&se=2030-06-19T20:01:23Z&spr=https&sv=2024-11-04&sr=b&sig=jDXqCynRcQRMKt167h1vKCQjP2ycJcD40%2B4yzM4mB4k%3D',
        },
        spots: [],
        region: {
          center: { lat: 51.788581, lon: 7.619051 },
          radius: 206,
        },
        options: {
          scannerRadius: 40,
          snapRadius: 50,
          discoveryMode: 'free' as DiscoveryMode,
          previewMode: 'preview' as PreviewMode,
        },
        image: {
          id: 'clx4j9k2n000201mh7b3m5r8x',
          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: YESTERDAY,
      },
    ],
  },
  spots: {
    id: STORES.SPOTS,
    fileName: jsonFile(STORES.SPOTS),
    data: [
      // Spots for Discovery Trail
      {
        id: 'clx4j9k2n000301mh9e5p6t4w',
        name: 'Central Park Fountain',
        slug: 'central-park-fountain-8472',
        description: 'A beautiful modern fountain in the heart of the central park.',
        location: { lat: 51.797, lon: 7.627 },
        options: {
          discoveryRadius: 10,
          clueRadius: 150,
        },
        image: {
          id: 'clx4j9k2n000401mh2f7q8y5z',
          previewUrl:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df-blurred.jpg?sp=r&st=2025-06-21T18:56:23Z&se=2030-06-22T02:56:23Z&spr=https&sv=2024-11-04&sr=b&sig=xS8kCF8G9fOMzZFawQvfxKnJD1uHWH0V5eDOlDTbL3w%3D',

          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: YESTERDAY,
      },
      {
        id: 'clx4j9k2n000401mh2f7q8y5z',
        name: 'Historic City Gate',
        slug: 'historic-city-gate-2948',
        description: 'The remaining gate of the old city wall, dating back to the 15th century.',
        location: { lat: 51.794, lon: 7.619 },
        options: {
          discoveryRadius: 10,
          clueRadius: 100,
        },
        image: {
          id: 'clx4j9k2n000501mh3h8r9a6b',
          previewUrl:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df-blurred.jpg?sp=r&st=2025-06-21T18:56:23Z&se=2030-06-22T02:56:23Z&spr=https&sv=2024-11-04&sr=b&sig=xS8kCF8G9fOMzZFawQvfxKnJD1uHWH0V5eDOlDTbL3w%3D',

          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: LAST_WEEK,
      },
      {
        id: 'clx4j9k2n000501mh3h8r9a6b',
        name: 'Botanical Garden',
        slug: 'botanical-garden-6138',
        description: 'A small botanical garden featuring local and exotic plants.',
        location: { lat: 51.799, lon: 7.63 },
        options: {
          discoveryRadius: 10,
          clueRadius: 180,
        },
        image: {
          id: 'clx4j9k2n000501mh3h8r9a6b',
          previewUrl:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df-blurred.jpg?sp=r&st=2025-06-21T18:56:23Z&se=2030-06-22T02:56:23Z&spr=https&sv=2024-11-04&sr=b&sig=xS8kCF8G9fOMzZFawQvfxKnJD1uHWH0V5eDOlDTbL3w%3D',

          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: NOW,
      },
      {
        id: 'clx4j9k2n000601mh4j9s2c7d',
        name: 'Old Windmill',
        slug: 'old-windmill-4657',
        description: 'A preserved windmill from the 18th century that once produced flour for the town.',
        location: { lat: 51.788, lon: 7.622 },
        options: {
          discoveryRadius: 10,
          clueRadius: 120,
        },
        image: {
          id: 'clx4j9k2n000601mh4j9s2c7d',
          previewUrl:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df-blurred.jpg?sp=r&st=2025-06-21T18:56:23Z&se=2030-06-22T02:56:23Z&spr=https&sv=2024-11-04&sr=b&sig=xS8kCF8G9fOMzZFawQvfxKnJD1uHWH0V5eDOlDTbL3w%3D',

          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: YESTERDAY,
      },
      {
        id: 'clx4j9k2n000701mh5k1t3e8f',
        name: 'Lakeside Viewpoint',
        slug: 'lakeside-viewpoint-9321',
        description: 'A peaceful spot by the lake with benches and a beautiful view.',
        location: { lat: 51.802, lon: 7.615 },
        options: {
          discoveryRadius: 22,
          clueRadius: 130,
        },
        image: {
          id: 'clx4j9k2n000701mh5k1t3e8f',
          previewUrl:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df-blurred.jpg?sp=r&st=2025-06-21T18:56:23Z&se=2030-06-22T02:56:23Z&spr=https&sv=2024-11-04&sr=b&sig=xS8kCF8G9fOMzZFawQvfxKnJD1uHWH0V5eDOlDTbL3w%3D',

          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: LAST_WEEK,
      },
      // Spots for Trail 01
      {
        id: 'clx4j9k2n000801mh6m2u4g9h',
        name: 'Ancient Oak Tree',
        slug: 'ancient-oak-tree-7249',
        description: 'This 300-year-old oak tree stands as a natural landmark in the forest.',
        location: { lat: 51.778, lon: 7.625 },
        options: {
          discoveryRadius: 20,
          clueRadius: 100,
        },
        image: {
          id: 'clx4j9k2n000901mh7n3v5i1j',
          previewUrl:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df-blurred.jpg?sp=r&st=2025-06-21T18:56:23Z&se=2030-06-22T02:56:23Z&spr=https&sv=2024-11-04&sr=b&sig=xS8kCF8G9fOMzZFawQvfxKnJD1uHWH0V5eDOlDTbL3w%3D',

          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: LAST_WEEK,
      },
      {
        id: 'clx4j9k2n000901mh7n3v5i1j',
        name: 'Forest Stream',
        slug: 'forest-stream-3856',
        description: 'A small stream cutting through the forest, home to various amphibians.',
        location: { lat: 51.781, lon: 7.633 },
        options: {
          discoveryRadius: 15,
          clueRadius: 80,
        },
        image: {
          id: 'clx4j9k2n000901mh7n3v5i1j',
          previewUrl:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df-blurred.jpg?sp=r&st=2025-06-21T18:56:23Z&se=2030-06-22T02:56:23Z&spr=https&sv=2024-11-04&sr=b&sig=xS8kCF8G9fOMzZFawQvfxKnJD1uHWH0V5eDOlDTbL3w%3D',

          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: YESTERDAY,
      },
      {
        id: 'clx4j9k2n001001mh8p4w6k2l',
        name: 'Wildflower Meadow',
        slug: 'wildflower-meadow-5143',
        description: 'An open area filled with native wildflowers and buzzing with pollinators.',
        location: { lat: 51.772, lon: 7.628 },
        options: {
          discoveryRadius: 25,
          clueRadius: 120,
        },
        image: {
          id: 'clx4j9k2n001001mh8p4w6k2l',
          previewUrl:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df-blurred.jpg?sp=r&st=2025-06-21T18:56:23Z&se=2030-06-22T02:56:23Z&spr=https&sv=2024-11-04&sr=b&sig=xS8kCF8G9fOMzZFawQvfxKnJD1uHWH0V5eDOlDTbL3w%3D',

          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: YESTERDAY,
      },
      {
        id: 'clx4j9k2n001101mh9q5x7m3n',
        name: 'Scenic Viewpoint',
        slug: 'scenic-viewpoint-9067',
        description: 'A high point offering panoramic views of the surrounding countryside.',
        location: { lat: 51.775, lon: 7.618 },
        options: {
          discoveryRadius: 30,
          clueRadius: 150,
        },
        image: {
          id: 'clx4j9k2n001101mh9q5x7m3n',
          previewUrl:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df-blurred.jpg?sp=r&st=2025-06-21T18:56:23Z&se=2030-06-22T02:56:23Z&spr=https&sv=2024-11-04&sr=b&sig=xS8kCF8G9fOMzZFawQvfxKnJD1uHWH0V5eDOlDTbL3w%3D',

          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: LAST_WEEK,
      },
      // Spots for Ascheberg Kirmes Trail
      {
        id: 'cmc35ne37jbzs2db624de78df',
        name: 'Startpunkt',
        slug: 'startpunkt-ascheberg',
        description: 'Der Startpunkt des Ascheberg Kirmes Trails.',
        location: { lat: 51.787039, lon: 7.618135 },
        options: {
          discoveryRadius: 10,
          clueRadius: 100,
        },
        image: {
          id: 'cmc35ne37jbzs2db624de78df',
          previewUrl:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df-blurred.jpg?sp=r&st=2025-06-21T18:56:23Z&se=2030-06-22T02:56:23Z&spr=https&sv=2024-11-04&sr=b&sig=xS8kCF8G9fOMzZFawQvfxKnJD1uHWH0V5eDOlDTbL3w%3D',

          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: YESTERDAY,
      },
      {
        id: 'cmc35ne37bh0ue0d1ed0cc2ef',
        name: 'Kirchplatz',
        slug: 'kirchplatz-ascheberg',
        description: 'Der historische Kirchplatz in Ascheberg.',
        location: { lat: 51.789405, lon: 7.619343 },
        options: {
          discoveryRadius: 10,
          clueRadius: 120,
        },
        image: {
          id: 'cmc35ne37bh0ue0d1ed0cc2ef',
          previewUrl:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df-blurred.jpg?sp=r&st=2025-06-21T18:56:23Z&se=2030-06-22T02:56:23Z&spr=https&sv=2024-11-04&sr=b&sig=xS8kCF8G9fOMzZFawQvfxKnJD1uHWH0V5eDOlDTbL3w%3D',

          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: YESTERDAY,
      },
      {
        id: 'cmc35ne37epofcdec5574228c',
        name: 'Weinlaube',
        slug: 'weinlaube-ascheberg',
        description: 'Die gemütliche Weinlaube auf der Kirmes.',
        location: { lat: 51.789189, lon: 7.619713 },
        options: {
          discoveryRadius: 10,
          clueRadius: 80,
        },
        image: {
          id: 'cmc35ne37epofcdec5574228c',
          previewUrl:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df-blurred.jpg?sp=r&st=2025-06-21T18:56:23Z&se=2030-06-22T02:56:23Z&spr=https&sv=2024-11-04&sr=b&sig=xS8kCF8G9fOMzZFawQvfxKnJD1uHWH0V5eDOlDTbL3w%3D',

          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: YESTERDAY,
      },
      {
        id: 'cmc35ne372b0oc4427fc3c857',
        name: 'Raupe',
        slug: 'raupe-ascheberg',
        description: 'Das beliebte Raupe-Karussell auf der Kirmes.',
        location: { lat: 51.7879, lon: 7.619027 },
        options: {
          discoveryRadius: 10,
          clueRadius: 100,
        },
        image: {
          id: 'cmc35ne372b0oc4427fc3c857',
          previewUrl:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df-blurred.jpg?sp=r&st=2025-06-21T18:56:23Z&se=2030-06-22T02:56:23Z&spr=https&sv=2024-11-04&sr=b&sig=xS8kCF8G9fOMzZFawQvfxKnJD1uHWH0V5eDOlDTbL3w%3D',
          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: YESTERDAY,
      },
      {
        id: 'cmc35ne37bm8k939abb15c837',
        name: 'Katharinenplatz',
        slug: 'katharinenplatz-ascheberg',
        description: 'Der zentrale Katharinenplatz mit Kirmesständen.',
        location: { lat: 51.78846, lon: 7.619394 },
        options: {
          discoveryRadius: 10,
          clueRadius: 150,
        },
        image: {
          id: 'cmc35ne37bm8k939abb15c837',
          url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
          previewUrl:
            'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df-blurred.jpg?sp=r&st=2025-06-21T18:56:23Z&se=2030-06-22T02:56:23Z&spr=https&sv=2024-11-04&sr=b&sig=xS8kCF8G9fOMzZFawQvfxKnJD1uHWH0V5eDOlDTbL3w%3D',
        },
        createdAt: LAST_WEEK,
        updatedAt: YESTERDAY,
      },
    ],
  },
  trailSpots: {
    id: STORES.TRAIL_SPOTS,
    fileName: jsonFile(STORES.TRAIL_SPOTS),
    data: [
      // Discovery Trail spots
      {
        id: 'clx4j9k2n010101mh1a2b3c4d',
        trailId: 'clx4j9k2n000101mh8d4k9n2q',
        spotId: 'clx4j9k2n000301mh9e5p6t4w',
        order: 0,
        createdAt: LAST_WEEK,
      },
      {
        id: 'clx4j9k2n010102mh2b3c4d5e',
        trailId: 'clx4j9k2n000101mh8d4k9n2q',
        spotId: 'clx4j9k2n000401mh2f7q8y5z',
        order: 1,
        createdAt: LAST_WEEK,
      },
      {
        id: 'clx4j9k2n010103mh3c4d5e6f',
        trailId: 'clx4j9k2n000101mh8d4k9n2q',
        spotId: 'clx4j9k2n000501mh3h8r9a6b',
        order: 2,
        createdAt: LAST_WEEK,
      },
      {
        id: 'clx4j9k2n010104mh4d5e6f7g',
        trailId: 'clx4j9k2n000101mh8d4k9n2q',
        spotId: 'clx4j9k2n000601mh4j9s2c7d',
        order: 3,
        createdAt: LAST_WEEK,
      },
      {
        id: 'clx4j9k2n010105mh5e6f7g8h',
        trailId: 'clx4j9k2n000101mh8d4k9n2q',
        spotId: 'clx4j9k2n000701mh5k1t3e8f',
        order: 4,
        createdAt: LAST_WEEK,
      },
      // Ascheberg Trail spots
      {
        id: 'clx4j9k2n010106mh6f7g8h9i',
        trailId: 'cmc35a2qc12ome60777f19f2b',
        spotId: 'cmc35ne37jbzs2db624de78df',
        order: 0,
        createdAt: LAST_WEEK,
      },
      {
        id: 'clx4j9k2n010107mh7g8h9i1j',
        trailId: 'cmc35a2qc12ome60777f19f2b',
        spotId: 'cmc35ne37bh0ue0d1ed0cc2ef',
        order: 1,
        createdAt: LAST_WEEK,
      },
      {
        id: 'clx4j9k2n010108mh8h9i1j2k',
        trailId: 'cmc35a2qc12ome60777f19f2b',
        spotId: 'cmc35ne37epofcdec5574228c',
        order: 2,
        createdAt: LAST_WEEK,
      },
      {
        id: 'clx4j9k2n010109mh9i2j3l4m',
        trailId: 'cmc35a2qc12ome60777f19f2b',
        spotId: 'cmc35ne372b0oc4427fc3c857',
        order: 3,
        createdAt: LAST_WEEK,
      },
      {
        id: 'clx4j9k2n010110mh1j3k4m5n',
        trailId: 'cmc35a2qc12ome60777f19f2b',
        spotId: 'cmc35ne37bm8k939abb15c837',
        order: 4,
        createdAt: LAST_WEEK,
      },
    ],
  },
  discoveries: {
    id: STORES.DISCOVERIES,
    fileName: jsonFile(STORES.DISCOVERIES),
    data: [
      {
        id: 'clx4j9k2n001201mh1r6y8o4p',
        accountId: DEFAULT_USER_ID,
        spotId: 'clx4j9k2n000301mh9e5p6t4w',
        trailId: 'clx4j9k2n000101mh8d4k9n2q',
        discoveredAt: YESTERDAY,
        createdAt: YESTERDAY,
        updatedAt: YESTERDAY,
      },
      {
        id: 'clx4j9k2n001301mh2s7z9p5q',
        accountId: DEFAULT_USER_ID,
        spotId: 'clx4j9k2n000801mh6m2u4g9h',
        trailId: 'clx4j9k2n000201mh7b3m5r8x',
        discoveredAt: YESTERDAY,
        createdAt: YESTERDAY,
        updatedAt: YESTERDAY,
      },
      {
        id: 'clx4j9k2n001401mh3t8a1q6r',
        accountId: DEFAULT_USER_ID,
        spotId: 'clx4j9k2n000901mh7n3v5i1j',
        trailId: 'clx4j9k2n000201mh7b3m5r8x',
        discoveredAt: YESTERDAY,
        createdAt: YESTERDAY,
        updatedAt: YESTERDAY,
      },
    ],
  },
  scanEvents: {
    id: STORES.SENSOR_SCANS,
    fileName: jsonFile(STORES.SENSOR_SCANS),
    data: [
      {
        id: 'clx4j9k2n001501mh4u9b2r7s',
        accountId: DEFAULT_USER_ID,
        trailId: 'clx4j9k2n000101mh8d4k9n2q',
        scannedAt: YESTERDAY,
        radiusUsed: 100,
        successful: true,
        clues: [
          {
            id: 'clx4j9k2n001601mh5v1c3s8t',
            spotId: 'clx4j9k2n000301mh9e5p6t4w',
            trailId: 'clx4j9k2n000101mh8d4k9n2q',
            location: { lat: 51.797, lon: 7.627 },
            source: 'scanEvent',
          },
        ],
        location: { lat: 51.797, lon: 7.627 },
        createdAt: YESTERDAY,
      },
      {
        id: 'clx4j9k2n001701mh6w2d4t9u',
        accountId: DEFAULT_USER_ID,
        trailId: 'clx4j9k2n000101mh8d4k9n2q',
        scannedAt: YESTERDAY,
        radiusUsed: 100,
        successful: true,
        clues: [
          {
            id: 'clx4j9k2n001801mh7x3e5u1v',
            spotId: 'clx4j9k2n000301mh9e5p6t4w',
            trailId: 'clx4j9k2n000101mh8d4k9n2q',
            location: { lat: 51.797, lon: 7.627 },
            source: 'scanEvent',
          },
        ],
        location: { lat: 51.797, lon: 7.627 },
        createdAt: YESTERDAY,
      },
      {
        id: 'clx4j9k2n001901mh8y4f6v2w',
        accountId: DEFAULT_USER_ID,
        trailId: 'clx4j9k2n000201mh7b3m5r8x',
        scannedAt: YESTERDAY,
        radiusUsed: 150,
        successful: true,
        clues: [
          {
            id: 'clx4j9k2n002001mh9z5g7w3x',
            spotId: 'clx4j9k2n000801mh6m2u4g9h',
            trailId: 'clx4j9k2n000201mh7b3m5r8x',
            location: { lat: 51.778, lon: 7.625 },
            source: 'scanEvent',
          },
        ],
        location: { lat: 51.778, lon: 7.625 },
        createdAt: YESTERDAY,
      },
      {
        id: 'clx4j9k2n002101mh1a6h8x4y',
        accountId: DEFAULT_USER_ID,
        trailId: 'clx4j9k2n000201mh7b3m5r8x',
        scannedAt: YESTERDAY,
        radiusUsed: 150,
        successful: false,
        clues: [],
        location: { lat: 51.778, lon: 7.625 },
        createdAt: YESTERDAY,
      },
    ],
  },
}

export const getSandboxData = () => sandboxData
export const getSandboxConstants = () => ({
  DEFAULT_USER_ID,
  NOW,
  LAST_WEEK,
  YESTERDAY,
  ACCOUNT_SESSION,
})
