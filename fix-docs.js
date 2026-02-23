const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/docs/page.tsx', 'utf8');

// Remove any remaining references to companySections and platformSections
c = c.replace(/companySections/g, 'sections');
c = c.replace(/platformSections/g, 'sections');

// Remove the "Company" and "Platform" labels if still present
c = c.replace(/<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Company<\/p>\s*/g, '');
c = c.replace(/<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Platform<\/p>\s*/g, '');

// Also replace activeSection with active if needed, or vice versa - check which is used
// The old file uses activeSection, let's keep that
console.log('References fixed');
fs.writeFileSync('src/app/dashboard/docs/page.tsx', c);
