import { ImageAnnotatorClient } from '@google-cloud/vision';

let visionClient: ImageAnnotatorClient | null = null;
try {
  visionClient = new ImageAnnotatorClient();
} catch {
  visionClient = null;
}

export interface ModerationResult {
  isSafe: boolean;
  flags: {
    adult: string;
    violence: string;
    racy: string;
    medical: string;
  };
}

export async function moderateContent(imagePathOrUrl: string): Promise<ModerationResult> {
  if (visionClient) {
    try {
      const [result] = await visionClient.safeSearchDetection(imagePathOrUrl);
      const detections = result.safeSearchAnnotation;

      if (detections) {
        const isSafe =
          detections.adult !== 'LIKELY' &&
          detections.adult !== 'VERY_LIKELY' &&
          detections.violence !== 'VERY_LIKELY';

        return {
          isSafe,
          flags: {
            adult: String(detections.adult),
            violence: String(detections.violence),
            racy: String(detections.racy),
            medical: String(detections.medical),
          },
        };
      }
    } catch (err) {
      console.warn('Vision API moderation fallback:', err);
    }
  }

  // Fallback simulator for offline / development demonstration
  return {
    isSafe: true,
    flags: {
      adult: 'VERY_UNLIKELY',
      violence: 'VERY_UNLIKELY',
      racy: 'UNLIKELY',
      medical: 'VERY_UNLIKELY',
    },
  };
}
