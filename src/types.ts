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

export enum LANGUAGE {
  EN = 'en',
  EN_US = 'en-US',
  EN_GB = 'en-GB',
  ES = 'es',
  ES_ES = 'es-ES',
  ES_MX = 'es-MX',
  FR = 'fr',
  FR_FR = 'fr-FR',
  FR_CA = 'fr-CA',
  DE = 'de',
  DE_DE = 'de-DE',
  IT = 'it',
  IT_IT = 'it-IT',
  PT = 'pt',
  PT_BR = 'pt-BR',
  PT_PT = 'pt-PT',
  RU = 'ru',
  RU_RU = 'ru-RU',
  ZH = 'zh',
  ZH_CN = 'zh-CN',
  ZH_TW = 'zh-TW',
  JA = 'ja',
  JA_JP = 'ja-JP',
  KO = 'ko',
  KO_KR = 'ko-KR'
} 