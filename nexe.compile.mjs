import { compile } from "nexe";
import fs from "fs";

// 📖 Como funciona o versionamento AUTOMÁTICO:
// 1. O script 'nexe' no package.json agora roda "npm version patch" antes de tudo.
// 2. Isso aumenta automaticamente o número da versão no package.json (ex: 1.0.0 -> 1.0.1).
// 3. Em seguida, este script lê a versão ATUALIZADA e nomeia o executável.
const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
const version = packageJson.version;

compile({
  input: "./dist/main.js",
  output: `./package/SmartMonitor_v${version}.exe`,
  build: true,
  verbose: true,
  ico: "./icon.ico",
  patches: [
    async (compiler, next) => {
      // 🚀 INJEÇÃO DE AMBIENTE (BAKED-IN)
      // Lemos o .env local e o transformamos em código JS para o binário
      if (fs.existsSync("./.env")) {
        const envContent = fs.readFileSync("./.env", "utf8");
        const envLines = envContent
          .split("\n")
          .map(l => l.trim())
          .filter(l => l && !l.startsWith("#") && l.includes("="));
        
        let injectionCode = "\n// --- BAKE-IN ENVIRONMENT ---\n";
        envLines.forEach(line => {
          const [key, ...valParts] = line.split("=");
          const val = valParts.join("=").replace(/'/g, "\\'");
          injectionCode += `process.env['${key.trim()}'] = '${val.trim()}';\n`;
        });

        // Injetamos as variáveis no TOPO do arquivo de entrada no sistema virtual do nexe
        const originalInput = await compiler.readFileAsync("./dist/main.js");
        await compiler.setFileContentsAsync(
          "./dist/main.js",
          injectionCode + originalInput.contents,
        );
        console.log("💉 Configurações do .env injetadas com sucesso no binário!");
      }
      return next();
    },
  ],
})
  .then(() => {
    console.log(`✅ Compilação Finalizada! Versão: ${version}`);
    console.log(`📂 Local: ./package/SmartMonitor_v${version}.exe`);
  })
  .catch((err) => {
    console.error("❌ Erro na compilação Nexe:", err);
  });
