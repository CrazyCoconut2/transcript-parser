import { ParsedElement } from "language-tokenizer/dist/type";

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
  [key: string]: ParsedTranscript;
};

export type AlignedDialog = {
  begin: number;
  end: number;
  phrases: Partial<Record<string, any>>;
};