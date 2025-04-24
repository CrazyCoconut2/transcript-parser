export type Dialog = {
  begin: number; // in seconds
  end: number; // in seconds
  phrase: string;
};

export type Transcript = {
  duration: number; // Rename to TotalDuration
  dialogs: Dialog[];
};

export type Transcripts = {
  [key in LANGUAGE]?: Transcript;
};


export enum LANGUAGE {
  en,
  es,
  fr,
  pt,
  'pt-BR',
  it,
  de,
  pl,
  sv,
  da,
  nw
}