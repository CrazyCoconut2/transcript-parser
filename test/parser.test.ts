import { parseXmlContent, convertTimeToSeconds } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

describe('Transcript Parser', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');

  // Helper function to read fixture files
  const readFixture = (filename: string): string => {
    return fs.readFileSync(path.join(fixturesDir, filename), 'utf-8');
  };

  test('should parse EN_us_1.xml correctly', async () => {
    const xmlContent = readFixture('EN_us_1.xml');
    const result = await parseXmlContent(xmlContent);
    
    // Check if we have the correct language code
    expect(Object.keys(result)).toContain('en');
    
    const transcript = result['en'];
    
    // Check if we have dialogs
    expect(transcript.dialogs).toBeDefined();
    expect(transcript.dialogs.length).toBeGreaterThan(0);
    
    // Check if duration is calculated correctly
    expect(transcript.duration).toBeGreaterThan(0);
    
    // Check if the last dialog is parsed correctly
    const lastDialog = transcript.dialogs[transcript.dialogs.length - 1];
    expect(lastDialog.phrase).toBe('Subtitles by: J. Cameron');
    expect(lastDialog.begin).toBeGreaterThan(0);
    expect(lastDialog.end).toBeGreaterThan(lastDialog.begin);
  });

  test('should parse ES_es_1.xml correctly', async () => {
    const xmlContent = readFixture('ES_es_1.xml');
    const result = await parseXmlContent(xmlContent);
    
    expect(Object.keys(result)).toContain('es');
    const transcript = result['es'];
    
    expect(transcript.dialogs).toBeDefined();
    expect(transcript.dialogs.length).toBeGreaterThan(0);
    expect(transcript.duration).toBeGreaterThan(0);
  });

  test('should parse IT_it_2.xml correctly', async () => {
    const xmlContent = readFixture('IT_it_2.xml');
    const result = await parseXmlContent(xmlContent);
    
    expect(Object.keys(result)).toContain('it');
    const transcript = result['it'];
    
    expect(transcript.dialogs).toBeDefined();
    expect(transcript.dialogs.length).toBeGreaterThan(0);
    expect(transcript.duration).toBeGreaterThan(0);
  });

  test('should parse PT_br_1.xml correctly', async () => {
    const xmlContent = readFixture('PT_br_1.xml');
    const result = await parseXmlContent(xmlContent);
    
    expect(Object.keys(result)).toContain('pt-BR');
    const transcript = result['pt-BR'];
    
    expect(transcript.dialogs).toBeDefined();
    expect(transcript.dialogs.length).toBeGreaterThan(0);
    expect(transcript.duration).toBeGreaterThan(0);
  });

  test('should handle time conversion correctly', () => {
    // Test ticks format
    expect(convertTimeToSeconds('10000000t')).toBe(1);
    expect(convertTimeToSeconds('20000000t')).toBe(2);
    
    // Test HH:MM:SS format
    expect(convertTimeToSeconds('01:00:00')).toBe(3600);
    expect(convertTimeToSeconds('00:01:00')).toBe(60);
    expect(convertTimeToSeconds('00:00:01')).toBe(1);
  });

  test('should handle dialogs with line breaks correctly', async () => {
    const xmlContent = readFixture('EN_us_1.xml');
    const result = await parseXmlContent(xmlContent);
    const transcript = result['en'];
    
    // Find a dialog with line breaks
    const dialogWithLineBreak = transcript.dialogs.find(d => 
      d.phrase.includes('The feeling I\'m having today')
    );
    
    expect(dialogWithLineBreak).toBeDefined();
    expect(dialogWithLineBreak?.phrase).toContain('The feeling I\'m having today');
    expect(dialogWithLineBreak?.phrase).toContain('there is no explanation for it');
  });
}); 