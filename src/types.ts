import { ParsedElement } from "language-tokenizer/dist/type";
import { LanguageCode } from "./language-codes";

export interface Dialog {
  begin: number;
  end: number;
  phrase: string;
}

export interface ParsedTranscript {
  duration: number;
  dialogs: Dialog[];
}

export type Transcripts = {
  [K in LanguageCode]?: ParsedTranscript;
};

export type AlignedDialog = {
  begin: number;
  end: number;
  phrases: Partial<Record<LanguageCode, string>>;
  parsedPhrases?: Partial<Record<LanguageCode, ParsedElement[]>>;
};