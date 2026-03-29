#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import http from 'http';
import { execSync } from 'child_process';
import { compileSCML } from '../lib/compiler.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const args = process.argv.slice(2);
let command = args[0] || 'help';
let projectName = args[1] || 'my-scml-app';

// --- 1. CREATE LOGIC (With Auto-Fill) ---
async function createProject(name) {
    const targetDir = path.join(process.cwd(), name);

    if (fs.existsSync(targetDir)) {
        console.log(chalk.red(`❌ Error: Folder '${name}' already exists!`));
        return;
    }

    console.log(chalk.cyan(`🏗️  Creating SCML project: ${name}...`));

    const templateDir = path.join(__dirname, '../templates');

    try {
        if (!fs.existsSync(templateDir)) {
            throw new Error("Templates folder not found!");
        }
        
        // Step A: Copy all files
        await fs.copy(templateDir, targetDir);

        // Step B: Auto-fill Project Name in package.json and index.scml
        const filesToUpdate = ['package.json', 'index.scml'];
        filesToUpdate.forEach(file => {
            const filePath = path.join(targetDir, file);
            if (fs.existsSync(filePath)) {
                let content = fs.readFileSync(filePath, 'utf8');
                // Replace placeholders
                content = content.replace(/{{PROJECT_NAME}}/g, name);
                content = content.replace(/<WebName><\/WebName>/g, `<WebName>${name}</WebName>`);
                fs.writeFileSync(filePath, content);
            }
        });

        console.log(chalk.green(`\n✅ Success! Project '${name}' created.`));
        console.log(chalk.yellow(`\nNext steps:`));
        console.log(chalk.white(`  cd ${name}`));
        console.log(chalk.white(`  scml run`));
    } catch (err) {
        console.log(chalk.red("❌ Error:"), err.message);
    }
}


// --- 2. BUILD & DEPLOY ---
async function buildProject() {
    const scmlFile = path.join(process.cwd(), 'index.scml');
    const htmlFile = path.join(process.cwd(), 'index.html');

    if (!fs.existsSync(scmlFile)) return console.log(chalk.red("❌ Error: index.scml not found!"));

    try {
        let content = fs.readFileSync(scmlFile, 'utf8');
        let htmlOutput = compileSCML(content, false);
        fs.writeFileSync(htmlFile, htmlOutput);
        
        console.log(chalk.green("✨ Compiled successfully!"));

        // Check for assets folder to ensure icons are deployed
        if (!fs.existsSync(path.join(process.cwd(), 'assets'))) {
            console.log(chalk.yellow("⚠️ Warning: 'assets' folder missing. Icons might not show."));
        }

        console.log(chalk.cyan("\n🌐 Deploying to Surge..."));
        
        try {
            try { execSync('surge --version', { stdio: 'ignore' }); } 
            catch (e) { execSync('npm install -g surge', { stdio: 'inherit' }); }

            const domain = `${path.basename(process.cwd())}-${Math.random().toString(36).substring(7)}.surge.sh`;
            
            // Surge command (Hamesha https domain return karta hai)
            execSync(`surge . ${domain}`, { stdio: 'inherit' });

            console.log(chalk.green(`\n🎉 Project Live: https://${domain}`));
        } catch (e) {
            console.log(chalk.red("❌ Surge deployment failed. Check if you are logged in ('surge login')."));
        }
    } catch (err) { console.log(chalk.red("❌ Build Failed:"), err); }
}

// --- 3. DEV SERVER ---
function startDevServer() {
    const scmlFile = path.join(process.cwd(), 'index.scml');
    if (!fs.existsSync(scmlFile)) return console.log(chalk.red("❌ Error: index.scml not found!"));

    const server = http.createServer((req, res) => {
        // Serve assets from the assets folder
        if (req.url.startsWith('/assets/')) {
            const assetPath = path.join(process.cwd(), decodeURIComponent(req.url));
            if (fs.existsSync(assetPath)) {
                // Basic MIME type detection
                const ext = path.extname(assetPath).toLowerCase();
                const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
                res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
                return fs.createReadStream(assetPath).pipe(res);
            }
        }

        try {
            let content = fs.readFileSync(scmlFile, 'utf8');
            let htmlOutput = compileSCML(content, true);
            const etag = Buffer.from(htmlOutput).toString('base64').substring(0, 20);
            res.writeHead(200, { 'Content-Type': 'text/html', 'ETag': etag });
            res.end(htmlOutput);
        } catch (e) { res.end("Error loading SCML"); }
    });

server.listen(3000, () => {
    console.log(chalk.green(`🚀 Dev Server: http://localhost:3000`));
    
    console.log();

    console.log(chalk.blueBright(`✨✨✨ Please click the link.`));
});
}

// Command execution
if (command === 'run') startDevServer();
else if (command === 'build') buildProject();
else if (command === 'create') createProject(projectName);
else {
    console.log(chalk.magenta("📖 SCML Usage:"));
    console.log("  scml create <name>");
    console.log("  scml run");
    console.log("  scml build");
}