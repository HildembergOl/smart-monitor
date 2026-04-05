import { compile } from "nexe";
import fs from "fs";

// 📖 Como funciona o versionamento dinâmico:
// 1. Lemos o arquivo package.json que contém a verdade sobre a versão do projeto.
// 2. Extraímos a propriedade "version" (ex: 1.0.0).
// 3. Usamos essa variável para nomear o executável final de forma organizada.
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
