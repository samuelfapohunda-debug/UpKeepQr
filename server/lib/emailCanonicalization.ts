export function canonicalizeEmail(email: string): string {
  const [localPart, domain] = email.toLowerCase().split('@');
  
  if (!domain) return email.toLowerCase();

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const withoutDots = localPart.replace(/\./g, '');
    const withoutPlus = withoutDots.split('+')[0];
    return `${withoutPlus}@gmail.com`;
  }

  const withoutPlus = localPart.split('+')[0];
  return `${withoutPlus}@${domain}`;
}

export function getEmailVariations(email: string): string[] {
  const [localPart, domain] = email.toLowerCase().split('@');
  
  if (!domain) return [email.toLowerCase()];

  const variations: string[] = [];

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const canonical = canonicalizeEmail(email);
    variations.push(canonical);
    
    const base = localPart.replace(/\./g, '').split('+')[0];
    
    variations.push(`${localPart}@gmail.com`);
    variations.push(`${localPart}@googlemail.com`);
    variations.push(`${base}@gmail.com`);
    variations.push(`${base}@googlemail.com`);
    
    for (let i = 1; i <= 5; i++) {
      variations.push(`${base}+${i}@gmail.com`);
      variations.push(`${base}+trial${i}@gmail.com`);
    }
  } else {
    variations.push(email.toLowerCase());
    const base = localPart.split('+')[0];
    variations.push(`${base}@${domain}`);
  }

  return [...new Set(variations)];
}
