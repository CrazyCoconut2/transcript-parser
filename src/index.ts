import { XMLParser } from 'fast-xml-parser';
import { Transcripts, Dialog, ParsedTranscript, AlignedDialog } from './types';
import { LanguageCode, LANGUAGE_MAPPING } from './language-codes';

/**
 * Normalizes a language code by mapping it to its base code
 * @param languageCode - The language code to normalize
 * @returns The normalized language code
 */
export const normalizeLanguageCode = (languageCode: string): string => {
  console.log(`[normalizeLanguageCode] Input language code: "${languageCode}"`);
  
  // First try to find an exact match in the mapping
  if (languageCode in LANGUAGE_MAPPING) {
    console.log(`[normalizeLanguageCode] Found exact match in mapping: "${languageCode}" -> "${LANGUAGE_MAPPING[languageCode]}"`);
    return LANGUAGE_MAPPING[languageCode];
  }
  
  // If no exact match, try to find a match for the base code
  const baseCode = languageCode.split(/[-_]/)[0];
  console.log(`[normalizeLanguageCode] No exact match, trying base code: "${baseCode}"`);
  
  if (baseCode in LANGUAGE_MAPPING) {
    console.log(`[normalizeLanguageCode] Found base code match: "${baseCode}" -> "${LANGUAGE_MAPPING[baseCode]}"`);
    return LANGUAGE_MAPPING[baseCode];
  }
  
  console.log(`[normalizeLanguageCode] No mapping found, returning base code: "${baseCode}"`);
  return baseCode;
};

/**
 * Validates if a language code is supported
 * @param languageCode - The language code to validate
 * @returns True if the language code is supported, false otherwise
 */
export const isSupportedLanguageCode = (languageCode: string): boolean => {
  console.log(`[isSupportedLanguageCode] Checking if "${languageCode}" is supported`);
  const normalizedCode = normalizeLanguageCode(languageCode);
  const isSupported = normalizedCode in LANGUAGE_MAPPING;
  console.log(`[isSupportedLanguageCode] Normalized code "${normalizedCode}" is ${isSupported ? 'supported' : 'NOT supported'}`);
  return isSupported;
};

/**
 * Converts a time string to seconds
 * @param time - Time string in either ticks format (e.g., "1234567t") or HH:MM:SS format
 * @returns Time in seconds
 */
export const convertTimeToSeconds = (time: string): number => {
  if (time.includes('t')) {
    return convertTicksToSeconds(time);
  } else if (time.includes(':')) {
    return convertHHMMSSToSeconds(time);
  } else {
    return convertTicksToSeconds(time);
  }
};

/**
 * Converts ticks to seconds
 * @param tickString - Time string in ticks format (e.g., "1234567t")
 * @returns Time in seconds
 */
export const convertTicksToSeconds = (tickString: string): number => {
  const ticks = parseInt(tickString.slice(0, -1), 10);
  const ticksPerSecond = 1e7;
  return ticks / ticksPerSecond;
};

/**
 * Converts HH:MM:SS format to seconds
 * @param time - Time string in HH:MM:SS format
 * @returns Time in seconds
 */
export const convertHHMMSSToSeconds = (time: string): number => {
  const [hours, minutes, seconds] = time.split(':');
  const h = parseFloat(hours);
  const m = parseFloat(minutes);
  const s = parseFloat(seconds);
  return h * 3600 + m * 60 + s;
};

const getDuration = (arr: any[]): number => {
  return convertTicksToSeconds(arr[arr.length - 1]['@_end']);
};

/**
 * Parses XML content into a Transcripts object
 * @param xmlContent - XML string content
 * @returns Promise resolving to Transcripts object
 * @throws Error if XML content is invalid or language is unsupported
 */
export const parseXmlContent = (xmlContent: string): Promise<Transcripts> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('[parseXmlContent] Starting XML parsing');
      const parser = new XMLParser({
        ignoreAttributes: false,
      });

      const xmlData = parser.parse(xmlContent);
      const rawLanguageCode = xmlData.tt['@_xml:lang'];
      console.log(`[parseXmlContent] Raw language code from XML: "${rawLanguageCode}"`);
      
      const normalizedLanguageCode = normalizeLanguageCode(rawLanguageCode);
      console.log(`[parseXmlContent] Normalized language code: "${normalizedLanguageCode}"`);

      // Check if the language is supported
      if (!isSupportedLanguageCode(normalizedLanguageCode)) {
        console.log(`[parseXmlContent] Unsupported language: "${normalizedLanguageCode}"`);
        reject(new Error(`Unsupported language: ${normalizedLanguageCode}`));
        return;
      }

      const parsedTranslation: ParsedTranscript = {
        duration: getDuration(xmlData['tt']['body']['div']['p']),
        dialogs: [],
      };

      for (const elem of xmlData['tt']['body']['div']['p']) {
        const begin = convertTimeToSeconds(elem['@_begin']);
        const end = convertTimeToSeconds(elem['@_end']);
        let currentPhrase = '';

        if (Array.isArray(elem['span'])) {
          currentPhrase = elem['span'].map((phrase: any) => phrase['#text']).join(' ');
        } else if (elem['span']) {
          currentPhrase = elem['span']['#text'];
        } else if (elem['#text']) {
          currentPhrase = elem['#text'];
        }

        parsedTranslation.dialogs.push({ begin, end, phrase: currentPhrase });
      }

      console.log(`[parseXmlContent] Returning transcript with language code: "${normalizedLanguageCode}"`);
      resolve({ [normalizedLanguageCode as LanguageCode]: parsedTranslation });
    } catch (error) {
      console.error('[parseXmlContent] Error parsing XML:', error);
      reject(new Error('Could not parse XML content'));
    }
  });
};

/**
 * Parses multiple transcript URLs
 * @param urls - Array of URLs pointing to transcript XML files
 * @returns Promise resolving to Transcripts object
 */
export const parseTranscripts = async (urls: string[]): Promise<Transcripts> => {
  console.log(`[parseTranscripts] Starting to parse ${urls.length} transcripts`);
  const arrayOfTranscripts = await Promise.all(
    urls.map(async (url) => {
      try {
        console.log(`[parseTranscripts] Fetching transcript from: ${url}`);
        const response = await fetch(url);
        const xmlContent = await response.text();
        return parseXmlContent(xmlContent);
      } catch (error: any) {
        console.warn(`[parseTranscripts] Error parsing transcript from ${url}: ${error.message || 'Unknown error'}`);
        return {}; // Return empty object for failed transcripts
      }
    })
  );

  // Combine transcripts while ensuring language codes are normalized
  const combinedTranscripts: Transcripts = {};
  
  console.log('[parseTranscripts] Combining transcripts');
  arrayOfTranscripts.forEach((transcript, index) => {
    console.log(`[parseTranscripts] Processing transcript ${index + 1}/${arrayOfTranscripts.length}`);
    console.log(`[parseTranscripts] Transcript keys: ${Object.keys(transcript).join(', ')}`);
    
    Object.entries(transcript).forEach(([langCode, parsedTranscript]) => {
      console.log(`[parseTranscripts] Processing language code: "${langCode}"`);
      const normalizedLangCode = normalizeLanguageCode(langCode);
      console.log(`[parseTranscripts] Normalized language code: "${normalizedLangCode}"`);
      
      // Only include supported language codes
      if (isSupportedLanguageCode(normalizedLangCode)) {
        console.log(`[parseTranscripts] Adding transcript with language code: "${normalizedLangCode}"`);
        // Cast to LanguageCode to ensure type compatibility
        combinedTranscripts[normalizedLangCode as LanguageCode] = parsedTranscript;
      } else {
        console.warn(`[parseTranscripts] Skipping unsupported language code: ${langCode}`);
      }
    });
  });

  console.log(`[parseTranscripts] Final combined transcripts keys: ${Object.keys(combinedTranscripts).join(', ')}`);
  return combinedTranscripts;
};

export function alignDialogsByTimestamps(
  transcripts: Transcripts,
  tolerance = 1.5 // increase a bit to allow flexibility
): AlignedDialog[] {
  console.log('[alignDialogsByTimestamps] Starting alignment');
  console.log(`[alignDialogsByTimestamps] Transcript keys: ${Object.keys(transcripts).join(', ')}`);
  
  const langs = Object.keys(transcripts) as LanguageCode[];
  console.log(`[alignDialogsByTimestamps] Language codes: ${langs.join(', ')}`);

  if (langs.length === 0) {
    console.log('[alignDialogsByTimestamps] No language codes found, returning empty array');
    return [];
  }

  const baseLang = langs[0];
  console.log(`[alignDialogsByTimestamps] Using base language: "${baseLang}"`);
  
  const baseDialogs = transcripts[baseLang]?.dialogs ?? [];
  console.log(`[alignDialogsByTimestamps] Base language has ${baseDialogs.length} dialogs`);

  const aligned: AlignedDialog[] = [];

  for (const baseDialog of baseDialogs) {
    const group: AlignedDialog = {
      begin: baseDialog.begin,
      end: baseDialog.end,
      phrases: {
        [baseLang]: baseDialog.phrase,
      },
    };

    for (const lang of langs) {
      if (lang === baseLang) continue;

      const langDialogs = transcripts[lang]?.dialogs ?? [];
      console.log(`[alignDialogsByTimestamps] Looking for matches in language "${lang}" with ${langDialogs.length} dialogs`);

      // Find closest match by time score
      const match = langDialogs
        .filter(
          (d: { begin: number; end: number }) =>
            Math.abs(d.begin - baseDialog.begin) < tolerance ||
            Math.abs(d.end - baseDialog.end) < tolerance
        )
        .sort(
          (
            a: { begin: number; end: number },
            b: { begin: number; end: number }
          ) => {
            const aScore =
              Math.abs(a.begin - baseDialog.begin) +
              Math.abs(a.end - baseDialog.end);
            const bScore =
              Math.abs(b.begin - baseDialog.begin) +
              Math.abs(b.end - baseDialog.end);
            return aScore - bScore;
          }
        )[0];

      if (match) {
        console.log(`[alignDialogsByTimestamps] Found match for language "${lang}" at time ${match.begin}`);
        group.phrases[lang] = match.phrase;
      } else {
        console.log(`[alignDialogsByTimestamps] No match found for language "${lang}" at time ${baseDialog.begin}`);
      }
    }

    aligned.push(group);
  }

  console.log(`[alignDialogsByTimestamps] Returning ${aligned.length} aligned dialogs`);
  return aligned;
}

// Export types
export { Transcripts, Dialog, ParsedTranscript };