const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/docs/page.tsx', 'utf8');
const lines = c.split('\n');

// Find line 36: <div className="flex">
// Replace everything from line 36 through line 77: <main className="flex-1...>
// with horizontal pills + content wrapper

let flexLine = -1;
let mainLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<div className="flex">') && flexLine === -1) flexLine = i;
  if (lines[i].includes('flex-1 p-8 max-w-5xl')) mainLine = i;
}

console.log('flex div at line:', flexLine + 1);
console.log('main at line:', mainLine + 1);

if (flexLine === -1 || mainLine === -1) {
  console.log('ERROR: Could not find markers');
  process.exit(1);
}

// Replace lines flexLine through mainLine (inclusive) with new layout
const newLayout = [
  '        <div className="flex gap-2 flex-wrap mb-6">',
  '          {sections.map((section) => (',
  '            <button',
  '              key={section.id}',
  '              onClick={() => setActiveSection(section.id)}',
  '              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${',
  "                activeSection === section.id",
  "                  ? 'bg-black text-white'",
  "                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'",
  '              }`}',
  '            >',
  '              {section.label}',
  '            </button>',
  '          ))}',
  '        </div>',
  '',
  '        <div className="bg-gray-50 rounded-lg p-6">',
];

const before = lines.slice(0, flexLine);
const after = lines.slice(mainLine + 1);
let result = [...before, ...newLayout, ...after].join('\n');

// Now remove the closing tags for the old sidebar layout
// The old layout had: <div flex> <aside>...</aside> <main>...</main> </div>
// We removed the aside and <div flex>, but still have the closing </main> and extra </div>
// Replace </main> with </div> (for our bg-gray-50 wrapper)
// And remove one </div> for the removed flex wrapper

// Find </main> closing tag
result = result.replace('</main>', '</div>');

// Remove "Company Docs" and "Platform Docs" if any remnants
result = result.replace(/Company Docs/g, '');
result = result.replace(/Platform Docs/g, '');

// Also remove the old sidebar wrapper closing divs if present
// The old structure has </aside> somewhere - remove it
result = result.replace(/<\/aside>/g, '');

// Update the date
result = result.replace(/Last Updated: February 4, 2026/g, 'Last updated: Feb 5, 2026');

// Add /api/docs reference if not present
if (!result.includes('/api/docs')) {
  result = result.replace(
    'Last updated: Feb 5, 2026',
    'Last updated: Feb 5, 2026 • Machine-readable: /api/docs'
  );
}

fs.writeFileSync('src/app/dashboard/docs/page.tsx', result);
console.log('Done! Lines:', result.split('\n').length);
