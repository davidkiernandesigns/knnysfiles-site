import type { Photo, Tone } from './site';

/* Example photos for the mockup, hotlinked from Unsplash (free to use under the Unsplash license). These are other
   photographers' work standing in for layout only. Replace them with Kenny's photos in /admin before launch. */
const U = 'https://images.unsplash.com/photo-';

const sets: Record<string, [string, string][]> = {
  weddings: [
    ['1519741497674-611481863552', 'groom beside bride holding a bouquet'],
    ['1520854221256-17451cc331bf', 'couple holding hands'],
    ['1779475501433-69a3a0b310f8', 'newlyweds walking through a sunny vineyard'],
    ['1532712938310-34cb3982ef74', 'bride and groom walking on a hill'],
    ['1757647630063-dd5cd82271f3', 'couple walking down an arched hallway'],
    ['1591604466107-ec97de577aff', 'groom in a gray suit with the bride'],
    ['1775126964671-43b4c1a1c5ce', 'bride and groom kissing outside an estate'],
    ['1606216794079-73f85bbd57d5', 'bride in her wedding dress'],
    ['1769540209843-c1e6a462b9d3', 'couple in wedding attire in a redwood forest'],
    ['1621801306185-8c0ccf9c8eb8', 'hands with henna holding each other'],
    ['1775126964334-93899cb3725a', 'bride and groom walking hand in hand outdoors'],
    ['1550784718-990c6de52adf', 'bride standing in front of the groom'],
    ['1621621667797-e06afc217fb0', 'groom holding a bouquet'],
    ['1599462616558-2b75fd26a283', 'couple in a sherwani and lehenga sharing a kiss'],
    ['1606216794074-735e91aa2c92', 'newly married couple walking through a field'],
  ],
  portraits: [
    ['1506863530036-1efeddceb993', 'black and white portrait of a woman wearing a necklace'],
    ['1606122017369-d782bbb78f32', 'woman in a striped button-up shirt'],
    ['1624711517157-25991163e537', 'woman in a red hoodie'],
    ['1544124094-8aea0374da93', 'black and white portrait of a woman in a hijab'],
    ['1536766768598-e09213fdcf22', 'woman in a brown headscarf'],
    ['1606143412458-acc5f86de897', 'woman in a black top'],
    ['1674932668403-33398b81c92f', 'close-up of a woman with a ponytail'],
    ['1603775020644-eb8decd79994', 'woman in a polka dot shirt'],
    ['1563170446-9c3c0622d8a9', 'woman with blue eyes in a white top'],
    ['1617744966315-b3c950c430c7', 'woman in a floral hijab'],
    ['1542458579-bc6f69b5ce6b', 'man in a gray top'],
    ['1642697643268-a1c7054ae1bb', 'man in a striped shirt and necklace'],
    ['1532170579297-281918c8ae72', 'woman in a black v-neck'],
  ],
  graduations: [
    ['1623461487986-9400110de28e', 'graduate in cap and gown'],
    ['1770223859888-0afec016dc56', 'graduate throwing a cap in the air on a road'],
    ['1627556704302-624286467c65', 'hands holding a graduation cap'],
    ['1761781342506-821be95168c5', 'graduates in blue caps and gowns sitting together'],
    ['1590012314607-cda9d9b699ae', 'graduates in light blue gowns at a ceremony'],
    ['1639765766830-d829d2fe4219', 'graduate tossing a cap into the sky'],
    ['1757875749961-9b52ef1299bb', 'two graduates jumping at sunset'],
    ['1627556704290-2b1f5853ff78', 'graduates throwing caps in the air'],
    ['1770223914355-76a1f1c8f6fc', 'two graduates jumping in caps and gowns'],
    ['1768489038182-7db6980fd841', 'smiling graduate with hands up'],
    ['1541339907198-e08756dedf3f', 'caps thrown in the air'],
    ['1607013407627-6ee814329547', 'three graduates holding their caps up'],
    ['1525921429624-479b6a26d84d', 'man in an academic gown'],
  ],
  misc: [
    ['1722153023306-a0618a3340c6', 'city street at night in black and white'],
    ['1501396358880-2d8f6ace3fc7', 'person walking beside a building'],
    ['1687575635446-092e15df323e', 'man on a phone call in black and white'],
    ['1634114581478-24f6ca21c18c', 'city street at night'],
    ['1600645907638-a15086818af3', 'man in a black jacket on snowy ground'],
    ['1632093762718-5ad3eecca62d', 'person walking down a street by a tall building'],
    ['1691040986240-fb7c5a2b3f35', 'man sitting in a chair in black and white'],
    ['1773154558364-d3207299a2ae', 'two people crossing a zebra crossing from above'],
  ],
};

export const exampleDescriptions: Record<string, string> = {
  weddings: 'the whole day, start to finish. getting ready, the vows, the dance floor and the quiet bits in between.',
  portraits: 'one person, one hour, no stiff poses. natural light, real expressions, photos that look like you on a good day.',
  graduations: 'caps, gowns and the people who got you there. on campus or somewhere that means something to you.',
  misc: 'the in-between stuff. streets, strangers, nights out and anything else that caught my eye.',
};

const tones: Tone[] = ['mocha', 'taupe', 'umber', 'stone'];

export function examplePhotos(folder: string): Photo[] {
  return (sets[folder] ?? []).map(([id, alt], i) => ({
    file: `kf_${String(i + 1).padStart(4, '0')}.jpg`,
    image: `${U}${id}`,
    alt,
    date: 'example',
    location: 'unsplash',
    tone: tones[i % tones.length],
  }));
}

export const exampleCover = (folder: string) => (sets[folder]?.[0] ? `${U}${sets[folder][0][0]}` : '');
