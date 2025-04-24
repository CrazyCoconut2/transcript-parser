import { XMLParser } from 'fast-xml-parser';
import { LANGUAGE, Transcripts, Dialog, ParsedTranscript } from './types';

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
  // Check if the exact language code is supported
  if (Object.values(LANGUAGE).includes(languageCode as any)) {
    return true;
  }
  
  // Check if the base language (without region) is supported
  const baseLanguage = languageCode.split('-')[0];
  return Object.values(LANGUAGE).includes(baseLanguage as any);
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

      if (!isLanguageSupported(rawLanguageCode)) {
        reject(new Error(`Unsupported language: ${rawLanguageCode}`));
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

      resolve({ [rawLanguageCode]: parsedTranslation });
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

// Export types
export { LANGUAGE, Transcripts, Dialog, ParsedTranscript };