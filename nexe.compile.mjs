import { compile } from "nexe";
import fs from "fs";

// 📖 Como funciona o versionamento AUTOMÁTICO:
// 1. O script 'nexe' no package.json agora roda "npm version patch" antes de tudo.
// 2. Isso aumenta automaticamente o número da versão no package.json (ex: 1.0.0 -> 1.0.1).
// 3. Em seguida, este script lê a versão ATUALIZADA e nomeia o executável.
const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
const version = packageJson.version;

compile({
  // O ponto de entrada (input) é o código já compilado pelo TSC na pasta dist
  input: "./dist/main.js",
  
  // O nome do arquivo de saída agora inclui a versão dinâmica do package.json
  output: `./package/SmartMonitor_v${version}.exe`,
  
  build: true, // Necessário para aplicar patches no binário do Node
  verbose: true,
  
  // Caminho para o ícone customizado da aplicação
  ico: "./icon.ico",
  
  patches: [
    async (compiler, next) => {
      // Patches permitem modificar o comportamento do runtime do Node embutido
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
