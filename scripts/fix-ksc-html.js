// scripts/fix-ksc-html.js
// One-time script: strip broken relative CSS/KaTeX refs from KSC HTML files
// Replaces with: inline styles + KaTeX CDN (handled by academia.js)

const fs = require('fs').promises;
const path = require('path');

const KSC_ROOT = path.join(__dirname, '..', 'content', 'KSC-Suggestions');

async function findHtmlFiles(dir, files = []) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) await findHtmlFiles(full, files);
        else if (entry.name.endsWith('.html')) files.push(full);
    }
    return files;
}

function stripBrokenRefs(html) {
    // Remove all <link rel="stylesheet" href="../..."> lines
    html = html.replace(/<link\s+rel="stylesheet"\s+href="\.\.[^"]*"[^>]*>\s*\n?/gi, '');
    // Remove KaTeX script tags with relative paths
    html = html.replace(/<script\s+defer\s+src="\.\.\/katex[^"]*"[^>]*><\/script>\s*\n?/gi, '');
    html = html.replace(/<script\s+src="\.\.\/katex[^"]*"[^>]*><\/script>\s*\n?/gi, '');
    // Remove the DOMContentLoaded renderMathInElement script (academia.js handles KaTeX)
    html = html.replace(/<!-- KaTeX Auto-Render Script -->[\s\S]*?<\/script>\s*\n?/gi, '');
    // Comment cleanup
    html = html.replace(/<!-- File Path:.*?-->\s*\n?/gi, '');
    html = html.replace(/<!-- Version:.*?-->\s*\n?/gi, '');
    return html;
}

(async () => {
    const files = await findHtmlFiles(KSC_ROOT);
    console.log(`Found ${files.length} HTML files`);

    let changed = 0;
    for (const file of files) {
        const original = await fs.readFile(file, 'utf-8');
        const cleaned = stripBrokenRefs(original);
        if (cleaned !== original) {
            await fs.writeFile(file, cleaned, 'utf-8');
            console.log(`✅ ${path.relative(KSC_ROOT, file)}`);
            changed++;
        } else {
            console.log(`⏭  ${path.relative(KSC_ROOT, file)} (no change)`);
        }
    }
    console.log(`\nDone: ${changed}/${files.length} files modified`);
})();