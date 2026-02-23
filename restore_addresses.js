const fs = require('fs');

// --- Helpers ----------------------------------------------------------------

function normalizePhone(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  return digits.slice(-10);
}

function sqlEscape(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function extractAddressFromNotes(notes) {
  if (!notes) return null;

  const streetTypes = '(?:St(?:reet)?|Ave(?:nue)?|Blvd|Boulevard|Rd|Road|Pkwy|Parkway|Dr(?:ive)?|Way|Pl(?:ace)?|Ct|Court|Ln|Lane|Square|Terrace|Circle)';

  const falseStarts = /^\d+[\-\d]*\s+(?:bed(?:room)?s?|bath(?:room)?s?|cat|cats|dog|dogs|kitchen|living|dining|full|half|studio|family|bdrm|br|litter)\b/i;

  // Apt/Unit can have spaces before the number, e.g. "Apt 4203" or "Apt. 3A"
  const addrRegex = new RegExp(
    '(\\d+[\\-\\d]*\\s+' +                           // house number
    '(?:[NSEW]\\.?\\s+)?' +                           // optional direction
    '(?:[A-Za-z][A-Za-z0-9]*|\\d+(?:st|nd|rd|th))' + // first word of street
    '(?:\\s+[A-Za-z0-9]+){0,3}\\s+' +                 // additional street name words
    streetTypes +                                      // street type
    '\\.?' +                                           // optional period
    '(?:\\s*,?\\s*(?:Apt|Unit|Suite|#)\\.?\\s*[\\w\\-]+)?' + // optional apartment
    '(?:\\s*,?\\s*[A-Za-z][A-Za-z\\s]+)?' +           // optional city
    '(?:\\s*,?\\s*(?:NY|New York|Brooklyn|Queens|Bronx|Manhattan|Astoria|LIC|Long Island City|Woodside|Sunnyside|Jackson Heights)' +
    '(?:[\\s,]*(?:NY))?\\s*\\d{5})?' +                // optional state/zip
    '(?:\\s*,?\\s*(?:United States|USA|US))?)',         // optional country
    'i'
  );

  const match = notes.match(addrRegex);
  if (match) {
    let candidate = match[1].trim().replace(/\s+/g, ' ');
    if (falseStarts.test(candidate)) return null;
    if (candidate.length < 10) return null;

    // Post-processing: if the extracted address ends with "Apt" or "Apt." but
    // is missing the unit number, look ahead in the original text for it
    if (/\b(?:Apt|Unit|Suite|#)\.?\s*$/i.test(candidate)) {
      const afterMatch = notes.substring(notes.indexOf(match[0]) + match[0].length);
      const unitNum = afterMatch.match(/^\s*(\w[\w\-]*)/);
      if (unitNum) {
        candidate = candidate + ' ' + unitNum[1];
      }
    }

    // Also: if we stopped before a zip code that follows, grab it
    const afterFull = notes.substring(notes.indexOf(match[0]) + match[0].length);
    const trailingZip = afterFull.match(/^\s*,?\s*(\d{5})/);
    if (trailingZip && !/\d{5}/.test(candidate)) {
      candidate = candidate + ' ' + trailingZip[1];
    }

    return candidate;
  }

  return null;
}

// --- Read files -------------------------------------------------------------

const csvPath = '/Users/jefftucker/Desktop/Supabase Snippet Clients Missing Addresses.csv';
const jsonPath = '/Users/jefftucker/Desktop/nycmaid/nycmaid-old/clients_import.json';

const csvRaw = fs.readFileSync(csvPath, 'utf-8');
const importData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const csvLines = csvRaw.trim().split('\n');
const missingClients = csvLines.slice(1).map(line => {
  const parts = line.split(',');
  return { id: parts[0], name: parts[1], phone: parts[2], address: parts[3] };
});

const importByPhone = new Map();
for (const rec of importData) {
  const key = normalizePhone(rec.phone);
  if (key) {
    if (!importByPhone.has(key) || (rec.address && rec.address.trim())) {
      importByPhone.set(key, rec);
    }
  }
}

// --- Match & classify -------------------------------------------------------

const foundInImport = [];
const foundInNotes  = [];
const neverHadAddress = [];
const notFoundInImport = [];

for (const client of missingClients) {
  const phoneKey = normalizePhone(client.phone);
  const match = importByPhone.get(phoneKey);

  if (!match) {
    notFoundInImport.push(client);
    continue;
  }

  const importAddr = (match.address || '').trim();
  const importNotes = (match.notes || '').trim();

  if (importAddr) {
    foundInImport.push({ client, importRec: match, address: importAddr, source: 'address_field' });
  } else {
    const extracted = extractAddressFromNotes(importNotes);
    if (extracted) {
      foundInNotes.push({ client, importRec: match, address: extracted, notes: importNotes, source: 'notes' });
    } else {
      neverHadAddress.push({ client, importRec: match });
    }
  }
}

// --- Output report ----------------------------------------------------------

console.log('='.repeat(80));
console.log('  RESTORE MISSING ADDRESSES -- REPORT');
console.log('  Generated: ' + new Date().toISOString());
console.log('='.repeat(80));

// Section 1
console.log('\n' + '-'.repeat(80));
console.log('  SECTION 1: Addresses found in original import data (' + foundInImport.length + ' clients)');
console.log('-'.repeat(80) + '\n');

if (foundInImport.length > 0) {
  console.log('-- SQL UPDATE statements to restore addresses from original import:\n');
  for (const item of foundInImport) {
    const escaped = sqlEscape(item.address);
    console.log("UPDATE clients SET address = '" + escaped + "' WHERE id = '" + item.client.id + "';");
    console.log('  -- ' + item.client.name + ' (phone: ' + item.client.phone + ')');
    console.log();
  }
} else {
  console.log('  (none)\n');
}

// Section 2
console.log('-'.repeat(80));
console.log('  SECTION 2: Addresses found embedded in notes fields (' + foundInNotes.length + ' clients)');
console.log('-'.repeat(80) + '\n');

if (foundInNotes.length > 0) {
  console.log('-- SQL UPDATE statements (REVIEW THESE -- extracted from notes, may need editing):\n');
  for (const item of foundInNotes) {
    const escaped = sqlEscape(item.address);
    console.log("UPDATE clients SET address = '" + escaped + "' WHERE id = '" + item.client.id + "';");
    console.log('  -- ' + item.client.name + ' (phone: ' + item.client.phone + ')');
    const noteSnippet = item.notes.substring(0, 200) + (item.notes.length > 200 ? '...' : '');
    console.log('  -- Extracted from notes: "' + noteSnippet + '"');
    console.log();
  }
} else {
  console.log('  (none)\n');
}

// Section 3
console.log('-'.repeat(80));
console.log('  SECTION 3: Clients that NEVER had an address in the original import (' + neverHadAddress.length + ' clients)');
console.log('-'.repeat(80) + '\n');

if (neverHadAddress.length > 0) {
  for (const item of neverHadAddress) {
    const notes = (item.importRec.notes || '').trim();
    console.log('  - ' + item.client.name + ' (phone: ' + item.client.phone + ', id: ' + item.client.id + ')');
    if (notes) {
      const noteSnippet = notes.substring(0, 150) + (notes.length > 150 ? '...' : '');
      console.log('    Notes: "' + noteSnippet + '"');
    } else {
      console.log('    Notes: (empty)');
    }
  }
  console.log();
} else {
  console.log('  (none)\n');
}

// Section 4
if (notFoundInImport.length > 0) {
  console.log('-'.repeat(80));
  console.log('  SECTION 4: Clients whose phone did not match any import record (' + notFoundInImport.length + ' clients)');
  console.log('-'.repeat(80) + '\n');
  for (const client of notFoundInImport) {
    console.log('  - ' + client.name + ' (phone: ' + client.phone + ', id: ' + client.id + ')');
  }
  console.log();
}

// Summary
console.log('='.repeat(80));
console.log('  SUMMARY');
console.log('='.repeat(80));
console.log('  Total missing-address clients in CSV:        ' + missingClients.length);
console.log('  Addresses recovered from import data:        ' + foundInImport.length);
console.log('  Addresses extracted from notes:              ' + foundInNotes.length);
console.log('  Never had an address (imported blank):       ' + neverHadAddress.length);
console.log('  Phone not found in import at all:            ' + notFoundInImport.length);
console.log('  -----------------------------------------');
console.log('  Total recoverable (ready for SQL):           ' + (foundInImport.length + foundInNotes.length));
console.log('='.repeat(80));

// Combined SQL
const allRecoverable = [...foundInImport, ...foundInNotes];
if (allRecoverable.length > 0) {
  console.log('\n');
  console.log('-- ========================================================================');
  console.log('-- COMBINED SQL -- Copy everything below this line');
  console.log('-- ========================================================================\n');
  console.log('BEGIN;\n');
  for (const item of allRecoverable) {
    const escaped = sqlEscape(item.address);
    const tag = item.source === 'notes' ? ' [FROM NOTES -- REVIEW]' : '';
    console.log("UPDATE clients SET address = '" + escaped + "' WHERE id = '" + item.client.id + "'; -- " + item.client.name + tag);
  }
  console.log('\nCOMMIT;');
}
