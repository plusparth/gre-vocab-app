export function isCorrectAnswer(input: string, word: string, stems: string[]): boolean {
  const normalized = input.trim().toLowerCase();
  const allForms = [word.toLowerCase(), ...stems.map(s => s.toLowerCase())];
  return allForms.includes(normalized);
}
