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
      // 🚀 SUBSTITUIÇÃO LITERAL GLOBAL (ENGESSAR EM TODOS OS ARQUIVOS)
      if (fs.existsSync("./.env")) {
        const envContent = fs.readFileSync("./.env", "utf8");
        const envVars = envContent
          .split("\n")
          .map(l => l.trim())
          .filter(l => l && !l.startsWith("#") && l.includes("="))
          .map(line => {
             const [key, ...valParts] = line.split("=");
             return { key: key.trim(), val: valParts.join("=").trim().replace(/'/g, "\\'") };
          });

        console.log("🛠️ Iniciando substituição global de variáveis na pasta dist/...");

        // Função para processar arquivos recursivamente no sistema virtual do nexe
        const processDirectory = async (dir) => {
          const files = await compiler.getFilesAsync(dir);
          for (const file of files) {
            if (file.isDirectory) {
              await processDirectory(file.absPath);
            } else if (file.absPath.endsWith(".js")) {
              let content = await compiler.readFileAsync(file.absPath);
              let code = content.contents;
              let changed = false;

              envVars.forEach(({ key, val }) => {
                const regexStr = `process\\.env\\.?\\[?['"]?${key}['"]?\\]?`;
                const regex = new RegExp(regexStr, "g");
                if (regex.test(code)) {
                  code = code.replace(regex, `'${val}'`);
                  changed = true;
                }
              });

              if (changed) {
                await compiler.setFileContentsAsync(file.absPath, code);
                console.log(`  ✅ ${file.absPath.replace(/\\/g, '/').split('dist/')[1]} -> [REPLACED]`);
              }
            }
          }
        };

        await processDirectory("./dist");
        console.log("💉 Configurações aplicadas e engessadas em todos os módulos!");
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
