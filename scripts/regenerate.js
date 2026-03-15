const res = await fetch('https://maintcue.com/api/maintenance/regenerate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ householdId: 'k5_ad4QdGwTiGPdaNFokC' }),
});

const text = await res.text();
console.log('Status:', res.status);
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text);
}
