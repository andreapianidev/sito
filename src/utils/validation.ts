/**
 * Utility per validazione campi form
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valida un codice fiscale italiano
 * Formato: 16 caratteri alfanumerici (RSSMRA80A01H501Z)
 */
export function validateFiscalCode(fiscalCode: string): ValidationResult {
  if (!fiscalCode || fiscalCode.trim() === '') {
    return { isValid: false, error: 'Il codice fiscale è obbligatorio' };
  }

  const cleaned = fiscalCode.toUpperCase().trim();

  // Deve essere esattamente 16 caratteri
  if (cleaned.length !== 16) {
    return { isValid: false, error: 'Il codice fiscale deve essere di 16 caratteri' };
  }

  // Pattern del codice fiscale italiano
  // 6 lettere + 2 numeri + 1 lettera + 2 numeri + 1 lettera + 3 numeri + 1 lettera
  const fiscalCodePattern = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;

  if (!fiscalCodePattern.test(cleaned)) {
    return { isValid: false, error: 'Formato codice fiscale non valido' };
  }

  return { isValid: true };
}

/**
 * Valida un numero di telefono italiano
 * Accetta vari formati: +39 333 1234567, 3331234567, +393331234567
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Il numero di telefono è obbligatorio' };
  }

  // Rimuovi spazi, trattini e parentesi
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Pattern per numero italiano
  // Può iniziare con +39 o 39, seguito da 9-10 cifre
  // Oppure solo 9-10 cifre (cellulare senza prefisso)
  const phonePatterns = [
    /^\+39[0-9]{9,10}$/,  // +393331234567
    /^39[0-9]{9,10}$/,    // 393331234567
    /^3[0-9]{8,9}$/,      // 3331234567 (cellulare)
    /^0[0-9]{9,10}$/,     // 0612345678 (fisso)
  ];

  const isValid = phonePatterns.some(pattern => pattern.test(cleaned));

  if (!isValid) {
    return {
      isValid: false,
      error: 'Numero di telefono non valido. Usa formato: +39 333 1234567'
    };
  }

  return { isValid: true };
}

/**
 * Formatta un numero di telefono in modo standard
 * Es: 3331234567 -> +39 333 1234567
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';

  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Se inizia con +39, mantienilo
  if (cleaned.startsWith('+39')) {
    const number = cleaned.substring(3);
    return `+39 ${number.substring(0, 3)} ${number.substring(3)}`;
  }

  // Se inizia con 39, aggiungi +
  if (cleaned.startsWith('39')) {
    const number = cleaned.substring(2);
    return `+39 ${number.substring(0, 3)} ${number.substring(3)}`;
  }

  // Se è un cellulare (inizia con 3), aggiungi +39
  if (cleaned.startsWith('3')) {
    return `+39 ${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
  }

  // Numero fisso con 0
  if (cleaned.startsWith('0')) {
    return `+39 ${cleaned}`;
  }

  return phone;
}

/**
 * Valida un CAP italiano
 */
export function validatePostalCode(postalCode: string): ValidationResult {
  if (!postalCode || postalCode.trim() === '') {
    return { isValid: false, error: 'Il CAP è obbligatorio' };
  }

  const cleaned = postalCode.trim();

  // CAP italiano: 5 cifre
  if (!/^[0-9]{5}$/.test(cleaned)) {
    return { isValid: false, error: 'Il CAP deve essere di 5 cifre' };
  }

  return { isValid: true };
}

/**
 * Valida una provincia italiana (sigla a 2 lettere)
 */
export function validateProvince(province: string): ValidationResult {
  if (!province || province.trim() === '') {
    return { isValid: false, error: 'La provincia è obbligatoria' };
  }

  const cleaned = province.toUpperCase().trim();

  if (!/^[A-Z]{2}$/.test(cleaned)) {
    return { isValid: false, error: 'La provincia deve essere una sigla di 2 lettere (es: RM, MI)' };
  }

  return { isValid: true };
}

/**
 * Valida un indirizzo email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'L\'email è obbligatoria' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return { isValid: false, error: 'Formato email non valido' };
  }

  return { isValid: true };
}
