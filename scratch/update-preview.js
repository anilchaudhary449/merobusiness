const fs = require('fs');

let c = fs.readFileSync('src/components/PreviewSite.tsx', 'utf8');

c = c.replace(
  'export default function PreviewSite({ site, isEditor = false }: { site: any, isEditor?: boolean }) {',
  'export default function PreviewSite({ site, ownerInfo, isEditor = false }: { site: any; ownerInfo?: any; isEditor?: boolean }) {'
);

c = c.replace(
  'const activeTheme = getThemePreset(site.theme);',
  `const activeTheme = getThemePreset(site.theme);
  const displayPhone = site.directPhone || ownerInfo?.phone || '';
  const displayEmail = site.businessEmail || ownerInfo?.email || '';
  const displayPan = ownerInfo?.panNumber || '';`
);

c = c.replace(/\{site\.directPhone && \(/g, '{displayPhone && (');
c = c.replace(/site\.directPhone/g, 'displayPhone');
c = c.replace(/site\.businessEmail/g, 'displayEmail');

let panHtml = `
            {displayPan && (
              <div className="flex items-start space-x-3 text-sm">
                <div className="mt-1 p-2 bg-white/5 rounded-lg">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-brand-accent">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold mb-1" style={{ color: 'var(--section-heading)' }}>PAN No.</p>
                  <p className="opacity-80">{displayPan}</p>
                </div>
              </div>
            )}
          </div>
`;

c = c.replace(/<\/div>\n\n          \{\/\* Map \*\/\}/g, panHtml + '\n\n          {/* Map */}');

fs.writeFileSync('src/components/PreviewSite.tsx', c);
