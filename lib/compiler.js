import chalk from 'chalk';

// 1. 📂 Mapping: [SCML Tag] -> [HTML Tag]
const tagMap = {
    'Scml': 'html',
    'Header': 'head',
    'ViewContent': 'body',
    'WebName': 'title',
    'Text': 'span',
    'Row': 'div',
    'Colume': 'div',
    'TextButton': 'button',
    'Button': 'button',
    'Input': 'input',
    'Touchlink': 'div',
    'Card': 'div',
};

export function compileSCML(content, isDev = false) {
    // --- A. Style Extraction ---
    const styleMatch = content.match(/<Style>([\s\S]*?)<\/Style>/);
    let styles = {};
    if (styleMatch) {
        try {
            styles = new Function(`return ${styleMatch[1].trim()}`)();
        } catch (e) {
            console.log(chalk.red("❌ Style Syntax Error:"), e.message);
        }
    }

    let bodyContent = content.replace(/<Style>[\s\S]*?<\/Style>/g, '');

    // --- B. HTML Protection ---
    const allAllowedTags = [...Object.keys(tagMap), 'WebIcon', 'Meta', 'Image', 'BgImage', 'PageLink'].join('|');
    const htmlStripperRegex = new RegExp(`<(?!\/?(${allAllowedTags})\\b)[^>]+>`, 'g');
    bodyContent = bodyContent.replace(htmlStripperRegex, '');

    let htmlOutput = bodyContent;

    // --- C. Framework Core CSS (Hidden Reset) ---
    const coreCSS = `
    <style>
        body { margin: 0; font-family: sans-serif; }
        div[data-type="Row"] { display: flex; flex-direction: row; }
        div[data-type="Colume"] { display: flex; flex-direction: column; }
        button { cursor: pointer; border: none; background: none; transition: opacity 0.2s; }
        button:active, .touchable:active { opacity: 0.5; transform: scale(0.98); }
        .card { border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 10px; background: #fff; }
        .bg-image { background-size: cover; background-position: center; position: relative; }
    </style>`;

    // --- D. Dynamic Tag & Attribute Replacement ---
    Object.entries(tagMap).forEach(([scmlTag, htmlTag]) => {
        // Tag replace karein aur layout logic ke liye data-type add karein
        htmlOutput = htmlOutput
            .replace(new RegExp(`<${scmlTag}`, 'g'), `<${htmlTag} data-type="${scmlTag}"`)
            .replace(new RegExp(`<\/${scmlTag}>`, 'g'), `</${htmlTag}>`);
    });

    // --- E. Special & Complex Tags Logic ---
    htmlOutput = htmlOutput
        // 1. Image Tags
        .replace(/<Image src={{uri:"(.*)"}} (.*)>/g, '<img src="assets/$1" $2>')
        .replace(/<BgImage src={{uri:"(.*)"}}(.*)>([\s\S]*?)<\/BgImage>/g, 
            '<div class="bg-image" style="background-image: url(\'assets/$1\');" $2>$3</div>')
        
        // 2. Navigation & Actions
        .replace(/onPress={(.*)}/g, 'onclick="$1()"')
        .replace(/<PageLink (.*) \/>/g, (match, p1) => {
             const path = p1.match(/src={"(.*)"}/)[1].replace('.scml', '.html');
             return `onclick="window.location.href='${path}'"`;
        })

        // 3. Web Metadata
        .replace(/<WebIcon src={{uri:"(.*)"}}>/g, '<link rel="icon" href="assets/$1">')
        .replace(/<Meta (.*)>/g, '<meta $1>');

    // --- F. Style Injection ---
    Object.keys(styles).forEach(key => {
        const cssString = Object.entries(styles[key]).map(([p, v]) => {
            // Convert camelCase (JS) to kebab-case (CSS)
            const prop = p.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
            return `${prop}:${v}`;
        }).join(';');
        htmlOutput = htmlOutput.replace(new RegExp(`style={style.${key}}`, 'g'), `style="${cssString}"`);
    });

    // --- G. Final Assembly ---
    // Inject core CSS inside the <head> if it exists, else at top
    if (htmlOutput.includes('</head>')) {
        htmlOutput = htmlOutput.replace('</head>', `${coreCSS}</head>`);
    } else {
        htmlOutput = coreCSS + htmlOutput;
    }

    // Dev Refresh Script
    if (isDev) {
        const refreshScript = `<script>
            let lastModified = "";
            setInterval(() => {
                fetch(window.location.href, { cache: "no-store", method: "HEAD" })
                .then(res => {
                    const etag = res.headers.get('etag');
                    if (lastModified && etag !== lastModified) window.location.reload();
                    lastModified = etag;
                });
            }, 1000);
        </script>`;
        htmlOutput = htmlOutput.replace('</body>', `${refreshScript}</body>`);
    }

    return `<!DOCTYPE html>\n${htmlOutput}`;
}