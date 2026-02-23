const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/docs/page.tsx', 'utf8');

// Step 1: Find the exact layout structure and replace it
// The old layout is: <div className="flex gap-8"> with sidebar + main content
// We want: horizontal pills + content area

// Find the sidebar div and everything up to the content area
const lines = c.split('\n');
let navStartLine = -1;
let navEndLine = -1;
let contentStartLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('flex gap-8')) navStartLine = i;
  if (lines[i].includes('flex-1 min-w-0')) contentStartLine = i;
}

console.log('Nav starts at line:', navStartLine + 1);
console.log('Content starts at line:', contentStartLine + 1);

if (navStartLine === -1 || contentStartLine === -1) {
  console.log('Could not find layout markers. Showing first 100 lines:');
  lines.slice(0, 100).forEach((l, i) => {
    if (l.includes('flex') || l.includes('nav') || l.includes('sidebar') || l.includes('section') || l.includes('Company') || l.includes('Platform')) {
      console.log(`  ${i+1}: ${l.trim().substring(0, 100)}`);
    }
  });
  process.exit(1);
}

// Replace lines from navStartLine to contentStartLine with new layout
const newLayout = `        <div className="flex gap-2 flex-wrap mb-6">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={\`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors \${
                activeSection === section.id
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }\`}
            >
              {section.label}
            </button>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-6">`;

const before = lines.slice(0, navStartLine);
const after = lines.slice(contentStartLine + 1);

// Also need to fix the closing - remove the extra </div> from the old flex wrapper
// Find the last closing divs and remove one
let result = [...before, newLayout, ...after].join('\n');

// Remove the extra closing </div> for the old flex gap-8 wrapper
// It will be near the end of the file
const lastContent = result.lastIndexOf("        </main>");
if (lastContent !== -1) {
  // Check for extra </div> before </main>
  const beforeMain = result.substring(0, lastContent);
  const closeDiv = beforeMain.lastIndexOf("      </div>");
  if (closeDiv !== -1) {
    const between = beforeMain.substring(closeDiv + 12, lastContent).trim();
    if (between === '</div>' || between === '\n      </div>' || between.match(/^\s*<\/div>\s*$/)) {
      // There's a double </div> - remove one
      result = result.substring(0, closeDiv) + result.substring(closeDiv + 12);
      console.log('Removed extra closing div');
    }
  }
}

// Update date
result = result.replace('Last Updated: February 4, 2026', 'Last updated: Feb 5, 2026 • Machine-readable: /api/docs');

fs.writeFileSync('src/app/dashboard/docs/page.tsx', result);
console.log('Done! Lines:', result.split('\n').length);
