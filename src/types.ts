import { ParsedElement } from "language-tokenizer/dist/type";
import { LANGUAGE_CODE } from "languages-utils";

export interface Dialog {
  begin: number;
  end: number;
  phrase: string;
}

export interface ParsedTranscript {
  duration: number;
  dialogs: Dialog[];
}

export interface Transcripts {
  [languageCode: string]: ParsedTranscript;
}

export type AlignedDialog = {
  begin: number;
  end: number;
  phrases: Partial<Record<LANGUAGE_CODE, string>>;
  parsedPhrases?: Partial<Record<LANGUAGE_CODE, ParsedElement[]>>;
};