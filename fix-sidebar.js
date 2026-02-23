const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/docs/page.tsx', 'utf8');

// Replace the horizontal pills layout with a left sidebar
c = c.replace(
  `        <div className="flex gap-2 flex-wrap mb-6">
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

        <div className="bg-gray-50 rounded-lg p-6">`,
  `        <div className="flex gap-8">
          <div className="w-56 shrink-0">
            <nav className="sticky top-6 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={\`block w-full text-left px-3 py-2 rounded-lg text-sm \${
                    activeSection === section.id
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }\`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          <main className="flex-1 min-w-0">`
);

// Fix the closing tags - need </main></div> instead of just </div>
c = c.replace(
  '        </div>\n    </div>\n  )\n}',
  '          </main>\n        </div>\n    </div>\n  )\n}'
);

fs.writeFileSync('src/app/dashboard/docs/page.tsx', c);
console.log('Sidebar restored! Lines:', c.split('\n').length);
