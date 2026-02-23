#!/bin/bash
# Replace inline tracking script with hosted t.js on ALL sites
# Run this on SiteGround via SSH from the home directory

COUNT=0
ERRORS=0

# Find all HTML files that contain the old tracking endpoint
for f in $(grep -rl "nycmaid.nyc/api/track" ~/*/public_html/ 2>/dev/null | grep -E '\.(html|htm|php)$'); do
  # Use python to reliably replace the script block
  python3 -c "
import re, sys
with open('$f', 'r') as fh:
    content = fh.read()
# Match the script tag containing the tracking code
pattern = r'<script[^>]*>\s*\(function\(\)\{[^<]*nycmaid\.nyc/api/track[^<]*\}\)\(\);\s*</script>'
replacement = '<script src=\"https://www.nycmaid.nyc/t.js\"></script>'
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
if new_content != content:
    with open('$f', 'w') as fh:
        fh.write(new_content)
    print(f'  Updated: $f')
    sys.exit(0)
else:
    print(f'  Skipped (no match): $f')
    sys.exit(1)
" 2>/dev/null
  if [ $? -eq 0 ]; then
    COUNT=$((COUNT + 1))
  fi
done

echo ""
echo "Done! Updated $COUNT files."
echo "All sites now use: https://www.nycmaid.nyc/t.js"
echo "CTA clicks (call/text) will now be tracked on mobile."
