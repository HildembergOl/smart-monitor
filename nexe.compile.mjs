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
      // 🚀 SUBSTITUIÇÃO LITERAL (ENGESSAR AS INFORMAÇÕES)
      if (fs.existsSync("./.env")) {
        const envContent = fs.readFileSync("./.env", "utf8");
        const envLines = envContent
          .split("\n")
          .map(l => l.trim())
          .filter(l => l && !l.startsWith("#") && l.includes("="));

        // Pegamos o conteúdo do bundle principal
        let bundleContent = await compiler.readFileAsync("./dist/main.js");
        let code = bundleContent.contents;

        console.log("🛠️ Iniciando substituição de variáveis no código...");

        envLines.forEach(line => {
          const [key, ...valParts] = line.split("=");
          const k = key.trim();
          const v = valParts.join("=").trim().replace(/'/g, "\\'");

          // Substitui tanto process.env.KEY quanto process.env['KEY'] quanto process.env["KEY"]
          const regexStr = `process\\.env\\.?\\[?['"]?${k}['"]?\\]?`;
          const regex = new RegExp(regexStr, "g");
          
          code = code.replace(regex, `'${v}'`);
          console.log(`  ✅ ${k} -> [REPLACED]`);
        });

        // Grava o código "engessado" de volta no sistema virtual do nexe
        await compiler.setFileContentsAsync("./dist/main.js", code);
        console.log("💉 Configurações aplicadas e engessadas no binário final!");
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
