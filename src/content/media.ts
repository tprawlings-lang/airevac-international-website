/**
 * Media registry.
 *
 * Blueprint page 10:
 *   "Use real AirEvac aircraft, crew, base, medical equipment, and operations
 *    images with written permission and accurate captions."
 *   "Do not publish patient faces, clinical details, documents, tail numbers,
 *    routes, or dates in stories without approved authorization and operations
 *    review."
 *
 * Every image on this site is registered here with its provenance and its
 * publication status, and `publishableMedia()` gates rendering - the same
 * contract the credential register applies to claims. An image is a claim: a
 * photograph of a crew loading an isolation pod asserts an isolation transport
 * capability just as surely as a sentence would.
 *
 * PROVENANCE OF THIS SET. All of these were recovered from AirEvac's own live
 * site at airevacinternational.com (WordPress media library, 2020–2022 uploads)
 * during the migration. They are AirEvac's own operational photography of
 * AirEvac's own aircraft and crew.
 *
 * ⚠️ WHAT THAT DOES NOT SETTLE (D12): "already on our website" is not the same
 * as "we hold the copyright and a model release". These were shot by someone,
 * and the crew in them are identifiable people. Before launch, Marketing must
 * confirm for each image: who took it, whether AirEvac owns or licenses it, and
 * whether the identifiable crew have consented to continued commercial use.
 * That is what `permissionId` records. Until then `status` stays
 * `inherited-from-live-site`, which publishes - because the image is already
 * public on AirEvac's own site, so republishing it changes nothing about its
 * exposure - but keeps the outstanding question visible and tracked.
 */

export type MediaStatus =
  /** Written permission and any releases confirmed. */
  | 'cleared'
  /** Already published by AirEvac on their own live site. Renders; D12 open. */
  | 'inherited-from-live-site'
  /** Withheld pending a specific approval. Never renders. */
  | 'hold';

export interface MediaAsset {
  id: string;
  /** Path under /public. */
  src: string;
  width: number;
  height: number;

  /**
   * Alt text. Describes what is visible, accurately and without inflating it
   * into a capability claim (WCAG 1.1.1, and blueprint page 10's "accurate
   * captions").
   */
  alt: string;

  /** Where it came from, for the permission file. */
  provenance: string;

  /** Permission record reference. Null until Marketing confirms under D12. */
  permissionId: string | null;

  status: MediaStatus;

  /** Why a `hold` is held, or what a status still depends on. */
  note?: string;
}

export const MEDIA: Record<string, MediaAsset> = {
  logo: {
    id: 'logo',
    src: '/media/airevac-logo-white.png',
    width: 760,
    height: 228,
    // The logo is the company's own mark; the alt is the company name because
    // that is what it communicates. No "logo" - a screen reader already says
    // "image".
    alt: 'AirEvac International',
    provenance: 'airevacinternational.com media library (2021/01/AirEvac_WHITE.png)',
    permissionId: 'AIREVAC-OWN-MARK',
    status: 'cleared',
    note: "AirEvac's own trademark. No third-party rights involved.",
  },

  aircraftGoldenHour: {
    id: 'aircraftGoldenHour',
    src: '/media/aircraft-golden-hour.jpg',
    width: 2400,
    height: 1601,
    alt: 'A Learjet parked on the ramp at dusk, viewed from the nose along the left side.',
    provenance: 'airevacinternational.com media library (2022/08/Copy-of-DSC07814.jpg)',
    permissionId: null,
    status: 'inherited-from-live-site',
    note:
      'No registration is legible in this frame, so it is used as general fleet ' +
      'imagery and is not attributed to a specific airframe. Calm rather than ' +
      'dramatic, which is what page 10 asks for.',
  },

  aircraftHangar: {
    id: 'aircraftHangar',
    src: '/media/aircraft-hangar.jpg',
    width: 1800,
    height: 1201,
    alt:
      'An AirEvac International aircraft inside a hangar with the airstair door open, ' +
      'showing the cabin entrance.',
    provenance: 'airevacinternational.com media library (2020/08/accredidation-hero.png)',
    permissionId: null,
    status: 'inherited-from-live-site',
  },

  aircraftEngineDetail: {
    id: 'aircraftEngineDetail',
    src: '/media/aircraft-engine-detail.jpg',
    width: 1000,
    height: 550,
    alt:
      'Close view of an AirEvac International aircraft’s rear fuselage, engine, and ' +
      'tailplane at dusk.',
    provenance: 'airevacinternational.com media library (2020/08/aircraft-2-photo.png)',
    permissionId: null,
    status: 'inherited-from-live-site',
    note:
      'A registration is painted on the aft fuselage but is not legible at this ' +
      'resolution. Deliberately not attributed to a specific airframe.',
  },

  aircraftRampFront: {
    id: 'aircraftRampFront',
    src: '/media/aircraft-ramp-front.jpg',
    width: 1800,
    height: 1200,
    alt: 'A Learjet seen head-on, parked on an airport ramp.',
    provenance: 'airevacinternational.com media library (2022/05/A78I4850.jpg)',
    permissionId: null,
    status: 'inherited-from-live-site',
  },

  crewIsolationLoading: {
    id: 'crewIsolationLoading',
    src: '/media/crew-isolation-loading.jpg',
    width: 1800,
    height: 1201,
    alt:
      'Three AirEvac flight crew in protective equipment loading a patient isolation ' +
      'transport unit through an aircraft door.',
    provenance: 'airevacinternational.com media library (2021/01/DSC08300.jpg)',
    permissionId: null,
    status: 'hold',
    note:
      'BLOCKER: two separate approvals needed, either of which is disqualifying ' +
      'on its own.\n' +
      '(1) CLINICAL: the image asserts an isolation transport capability. Page 6 ' +
      '    requires "isolation ... claims approved by the responsible clinical ' +
      '    owner", and no such approval exists. Publishing the photo makes the ' +
      '    claim whether or not any sentence does.\n' +
      '(2) PRIVACY: the isolation unit appears to contain a person. If that is a ' +
      '    real patient rather than a drill or a mannequin, page 10 requires ' +
      '    approved authorization before publication, and none is on file.\n' +
      'It is currently live on airevacinternational.com. That is not a clearance; ' +
      'it may be an existing exposure that should be reviewed there too.',
  },
};

/**
 * The gate. An asset renders only when its status permits publication.
 *
 * Mirrors `publishable()` in the credential register deliberately: an image
 * makes claims, so it goes through the same kind of check rather than being
 * trusted because someone dropped a file in /public.
 */
export function publishableMedia(asset: MediaAsset): boolean {
  return asset.status === 'cleared' || asset.status === 'inherited-from-live-site';
}

/** Assets still needing a permission record before launch (D12). */
export function mediaNeedingPermission(): MediaAsset[] {
  return Object.values(MEDIA).filter((asset) => asset.permissionId === null);
}
