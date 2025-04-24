# transcript-parser

A TypeScript package to parse XML or JSON transcripts into an accessible iterable JSON object.

## Installation

### From GitHub Packages

1. Create a `.npmrc` file in your project root with the following content:
```
@CracyCoconut2:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

2. Set up your GitHub token:
   - Create a GitHub Personal Access Token with `read:packages` scope
   - Set it as an environment variable: `export GITHUB_TOKEN=your_token_here`

3. Install the package:
```bash
npm install @CracyCoconut2/transcript-parser
```

## Features

- Parse XML transcripts into a structured JSON format
- Support for multiple languages
- Time conversion utilities (ticks to seconds, HH:MM:SS to seconds)
- TypeScript support with full type definitions

## Usage

```typescript
import { parseTranscripts, parseXmlContent, LANGUAGE } from '@CracyCoconut2/transcript-parser';

// Parse a single XML transcript
const xmlContent = '...'; // Your XML content
const transcript = await parseXmlContent(xmlContent);

// Parse multiple transcripts from URLs
const urls = [
  'https://example.com/transcript1.xml',
  'https://example.com/transcript2.xml'
];
const transcripts = await parseTranscripts(urls);

// Access the parsed data
console.log(transcripts[LANGUAGE.EN].duration);
console.log(transcripts[LANGUAGE.EN].dialogs);
```

## API

### Types

```typescript
interface Dialog {
  begin: number;  // Start time in seconds
  end: number;    // End time in seconds
  phrase: string; // The transcribed text
}

interface ParsedTranscript {
  duration: number;  // Total duration in seconds
  dialogs: Dialog[]; // Array of dialog entries
}

interface Transcripts {
  [languageCode: string]: ParsedTranscript;
}

enum LANGUAGE {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  PT = 'pt',
  RU = 'ru',
  ZH = 'zh',
  JA = 'ja',
  KO = 'ko'
}
```

### Functions

#### `parseXmlContent(xmlContent: string): Promise<Transcripts>`
Parses XML content into a Transcripts object.

#### `parseTranscripts(urls: string[]): Promise<Transcripts>`
Parses multiple transcript URLs and returns a combined Transcripts object.

#### `convertTimeToSeconds(time: string): number`
Converts a time string to seconds. Supports both ticks format (e.g., "1234567t") and HH:MM:SS format.

#### `convertTicksToSeconds(tickString: string): number`
Converts ticks to seconds.

#### `convertHHMMSSToSeconds(time: string): number`
Converts HH:MM:SS format to seconds.

## License

ISC

## Author

Mohammed Tigrini
