// scripts/strip-ksc-links.js
// One-time cleanup: strip broken external CSS/KaTeX refs from KSC HTML files
// CSS is loaded globally via academia.html; KaTeX loaded by academia.js

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
    // Remove ALL <link rel="stylesheet"> with relative paths (../)
    html = html.replace(/<link\s+rel="stylesheet"\s+href="\.\.[^"]*"\s*\/?>\s*\n?/gi, '');
    // Remove any <link> pointing to frontend/ folder
    html = html.replace(/<link\s+rel="stylesheet"\s+href="[^"]*frontend[^"]*"\s*\/?>\s*\n?/gi, '');
    // Remove KaTeX script tags (academia.js handles lazily)
    html = html.replace(/<script\s+defer\s+src="\.\.\/katex[^"]*"[^>]*><\/script>\s*\n?/gi, '');
    html = html.replace(/<script\s+src="\.\.\/katex[^"]*"[^>]*><\/script>\s*\n?/gi, '');
    // Remove inline KaTeX auto-render script (academia.js handles)
    html = html.replace(/<!-- KaTeX Auto-Render Script -->[\s\S]*?<\/script>\s*\n?/gi, '');
    // Clean up comment headers
    html = html.replace(/<!-- File Path:.*?-->\s*\n?/gi, '');
    html = html.replace(/<!-- Version:.*?-->\s*\n?/gi, '');
    return html;
}

(async () => {
    const files = await findHtmlFiles(KSC_ROOT);
    console.log(`Found ${files.length} HTML files in KSC-Suggestions\n`);

    let changed = 0;
    for (const file of files) {
        const original = await fs.readFile(file, 'utf-8');
        const cleaned = stripBrokenRefs(original);
        if (cleaned !== original) {
            await fs.writeFile(file, cleaned, 'utf-8');
            const bytes = original.length - cleaned.length;
            console.log(`✅ ${path.relative(KSC_ROOT, file)} (-${bytes} bytes)`);
            changed++;
        } else {
            console.log(`⏭  ${path.relative(KSC_ROOT, file)} (already clean)`);
        }
    }
    console.log(`\n📊 Done: ${changed}/${files.length} files modified`);
})();