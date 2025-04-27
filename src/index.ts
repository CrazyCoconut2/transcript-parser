import { XMLParser } from 'fast-xml-parser';
import { Transcripts, Dialog, ParsedTranscript, AlignedDialog } from './types';
import { LANGUAGE_CODE, LANGUAGES_CODES } from './language-codes';

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
 * @throws Error if XML content is invalid
 */
export const parseXmlContent = (xmlContent: string): Promise<Transcripts> => {
  return new Promise((resolve, reject) => {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        textNodeName: "#text",
        parseAttributeValue: true,
        trimValues: true,
        isArray: (name) => {
          return name === 'p' || name === 'span';
        },
        parseTagValue: false,
        tagValueProcessor: (tagName, tagValue) => {
          return tagValue;
        }
      });

      const xmlData = parser.parse(xmlContent);
      const languageCode = xmlData.tt['@_xml:lang'];

      const parsedTranslation: ParsedTranscript = {
        duration: getDuration(xmlData['tt']['body']['div']['p']),
        dialogs: [],
      };

      for (const elem of xmlData['tt']['body']['div']['p']) {
        const begin = convertTimeToSeconds(elem['@_begin']);
        const end = convertTimeToSeconds(elem['@_end']);
        let currentPhrase = '';

        if (Array.isArray(elem['span'])) {
          currentPhrase = elem['span']
            .map((span: any) => {
              if (typeof span === 'string') {
                return span;
              } else if (span['#text']) {
                return span['#text'];
              }
              return '';
            })
            .filter(Boolean)
            .join(' ');
        } else if (elem['span']) {
          if (typeof elem['span'] === 'string') {
            currentPhrase = elem['span'];
          } else if (elem['span']['#text']) {
            currentPhrase = elem['span']['#text'];
          }
        } else if (elem['#text']) {
          currentPhrase = elem['#text'];
        }

        parsedTranslation.dialogs.push({
          begin,
          end,
          phrase: currentPhrase.trim()
        });
      }

      resolve({ [languageCode]: parsedTranslation });
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
      try {
        const response = await fetch(url);
        const xmlContent = await response.text();
        return parseXmlContent(xmlContent);
      } catch (error: any) {
        return {}; // Return empty object for failed transcripts
      }
    })
  );

  const combinedTranscripts: Transcripts = {};
  
  arrayOfTranscripts.forEach(transcript => {
    Object.entries(transcript).forEach(([langCode, parsedTranscript]) => {
      combinedTranscripts[langCode] = parsedTranscript;
    });
  });

  // Normalize language codes after combining transcripts
  return fixLanguageCodes(combinedTranscripts);
};

/**
 * Fixes language codes in transcripts to match the expected format in LANGUAGES_CODES
 * For example, converts 'pt-BR' to 'pt'
 */
export const fixLanguageCodes = (transcripts: Transcripts): Transcripts => {
  const fixedTranscripts: Transcripts = {};
  
  // Get the available language codes
  const availableLanguageCodes = Object.keys(LANGUAGES_CODES) as LANGUAGE_CODE[];
  
  // Create a map of language codes to their base codes
  const languageCodeMap: Record<string, LANGUAGE_CODE> = {};
  
  // Add mappings for all available language codes
  availableLanguageCodes.forEach(code => {
    // Add variations with hyphens and underscores
    languageCodeMap[`${code}-${code.toUpperCase()}`] = code;
    languageCodeMap[`${code}_${code.toUpperCase()}`] = code;
    languageCodeMap[`${code}-${code.toLowerCase()}`] = code;
    languageCodeMap[`${code}_${code.toLowerCase()}`] = code;
    
    // Add special cases for specific languages
    if (code === 'pt') {
      languageCodeMap['pt-BR'] = code;
      languageCodeMap['pt_BR'] = code;
      languageCodeMap['pt-br'] = code;
      languageCodeMap['pt_br'] = code;
    }
    if (code === 'en') {
      languageCodeMap['en-US'] = code;
      languageCodeMap['en_US'] = code;
      languageCodeMap['en-us'] = code;
      languageCodeMap['en_us'] = code;
    }
    if (code === 'es') {
      languageCodeMap['es-ES'] = code;
      languageCodeMap['es_ES'] = code;
      languageCodeMap['es-es'] = code;
      languageCodeMap['es_es'] = code;
    }
    if (code === 'fr') {
      languageCodeMap['fr-FR'] = code;
      languageCodeMap['fr_FR'] = code;
      languageCodeMap['fr-fr'] = code;
      languageCodeMap['fr_fr'] = code;
    }
    if (code === 'de') {
      languageCodeMap['de-DE'] = code;
      languageCodeMap['de_DE'] = code;
      languageCodeMap['de-de'] = code;
      languageCodeMap['de_de'] = code;
    }
    if (code === 'it') {
      languageCodeMap['it-IT'] = code;
      languageCodeMap['it_IT'] = code;
      languageCodeMap['it-it'] = code;
      languageCodeMap['it_it'] = code;
    }
  });
  
  Object.keys(transcripts).forEach(langCode => {
    // Check if we have a direct mapping for this language code
    if (languageCodeMap[langCode]) {
      const baseLangCode = languageCodeMap[langCode];
      fixedTranscripts[baseLangCode] = transcripts[langCode];
    } 
    // If not, try to extract the base language code
    else {
      const baseLangCode = langCode.split(/[-_]/)[0] as LANGUAGE_CODE;
      
      // Check if the base language code is valid
      if (availableLanguageCodes.includes(baseLangCode)) {
        fixedTranscripts[baseLangCode] = transcripts[langCode];
      } else {
        console.warn(`Invalid language code: ${langCode}, base: ${baseLangCode}`);
        // Keep the original if normalization fails
        fixedTranscripts[langCode] = transcripts[langCode];
      }
    }
  });
  
  return fixedTranscripts;
};

export function alignDialogsByTimestamps(
  transcripts: Transcripts,
  tolerance = 1.5
): AlignedDialog[] {
  const langs = Object.keys(transcripts);

  if (langs.length === 0) {
    return [];
  }

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