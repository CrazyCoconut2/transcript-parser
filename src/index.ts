import { XMLParser } from 'fast-xml-parser';
import { Transcripts, Dialog, ParsedTranscript, AlignedDialog } from './types';
import { LANGUAGE_CODE, LANGUAGES_CODES, NETFLIX_LANGUAGE_MAPPING } from 'languages-utils';

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
 * Checks if a language code is supported
 * @param languageCode - The language code to check
 * @returns boolean indicating if the language is supported
 */
export const isLanguageSupported = (languageCode: string): boolean => {
  // Normalize the language code (replace underscores with hyphens)
  const normalizedCode = languageCode.replace('_', '-');
  
  // Check if the exact language code is supported
  if (Object.values(LANGUAGES_CODES).includes(normalizedCode as any)) {
    return true;
  }
  
  // Check if the base language (without region) is supported
  const baseLanguage = normalizedCode.split('-')[0];
  return Object.values(LANGUAGES_CODES).includes(baseLanguage as any);
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
      const parser = new XMLParser({
        ignoreAttributes: false,
      });

      const xmlData = parser.parse(xmlContent);
      const rawLanguageCode = xmlData.tt['@_xml:lang'];
      
      // Normalize the language code for storage and checking
      let normalizedLanguageCode = rawLanguageCode.replace('_', '-');
      if (!isLanguageSupported(normalizedLanguageCode)) {
        // Try to map the language code using Netflix's mapping
        if (NETFLIX_LANGUAGE_MAPPING[normalizedLanguageCode as keyof typeof NETFLIX_LANGUAGE_MAPPING]) {
          normalizedLanguageCode = NETFLIX_LANGUAGE_MAPPING[normalizedLanguageCode as keyof typeof NETFLIX_LANGUAGE_MAPPING];
          // Check if the mapped language is supported
          if (!isLanguageSupported(normalizedLanguageCode)) {
            reject(new Error(`Unsupported language: ${normalizedLanguageCode}`));
            return;
          }
        } else {
          reject(new Error(`Unsupported language: ${normalizedLanguageCode}`));
          return;
        }
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

      resolve({ [normalizedLanguageCode]: parsedTranslation });
    } catch (error) {
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
  const arrayOfTranscripts = await Promise.all(
    urls.map(async (url) => {
      const response = await fetch(url);
      const xmlContent = await response.text();
      return parseXmlContent(xmlContent);
    })
  );

  return arrayOfTranscripts.reduce((acc, curr) => ({ ...acc, ...curr }), {});
};

export function alignDialogsByTimestamps(
  transcripts: Transcripts,
  tolerance = 1.5 // increase a bit to allow flexibility
): AlignedDialog[] {
  const langs = Object.keys(transcripts) as LANGUAGE_CODE[];

  if (langs.length === 0) return [];

  const baseLang = langs[0];
  const baseDialogs = transcripts[baseLang]?.dialogs ?? [];

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
        group.phrases[lang] = match.phrase;
      }
    }

    aligned.push(group);
  }

  return aligned;
}

// Export types
export { Transcripts, Dialog, ParsedTranscript };