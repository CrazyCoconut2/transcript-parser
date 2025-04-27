// Define the supported language codes
export type LanguageCode = 'en' | 'es' | 'fr' | 'pt' | 'it' | 'de' | 'pl' | 'sv' | 'da' | 'nw';

// Define a mapping for language code normalization
export const LANGUAGE_MAPPING: Record<string, LanguageCode> = {
  'pt-BR': 'pt',
  'pt-PT': 'pt',
  'en-US': 'en',
  'en-GB': 'en',
  'es-ES': 'es',
  'es-MX': 'es',
  'fr-FR': 'fr',
  'fr-CA': 'fr',
  'it-IT': 'it',
  'de-DE': 'de',
  'pl-PL': 'pl',
  'sv-SE': 'sv',
  'da-DK': 'da',
  'no-NO': 'nw',
  // Add the base codes as well
  'pt': 'pt',
  'en': 'en',
  'es': 'es',
  'fr': 'fr',
  'it': 'it',
  'de': 'de',
  'pl': 'pl',
  'sv': 'sv',
  'da': 'da',
  'nw': 'nw',
}; 