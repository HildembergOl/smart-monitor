import { compile } from "nexe";
import fs from "fs";
import fsExtra from "fs-extra";
import path from "path";

// 📖 Como funciona o versionamento AUTOMÁTICO:
// 1. O script 'nexe' no package.json agora roda "npm version patch" antes de tudo.
// 2. Isso aumenta automaticamente o número da versão no package.json (ex: 1.0.0 -> 1.0.1).
// 3. Em seguida, este script lê a versão ATUALIZADA e nomeia o executável.
const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
const version = packageJson.version;

// 🚀 SUBSTITUIÇÃO LITERAL GLOBAL (ENGESSAR EM TODOS OS ARQUIVOS) ANTES DA COMPILAÇÃO
if (fs.existsSync("./.env")) {
  const envContent = fs.readFileSync("./.env", "utf8");
  const envVars = envContent
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(line => {
       const [key, ...valParts] = line.split("=");
       let val = valParts.join("=").trim();
       if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
         val = val.substring(1, val.length - 1);
       }
       return { key: key.trim(), val: val.replace(/'/g, "\\'") };
    });

  console.log("🛠️ Injetando variáveis engessadas na inicialização de dist/main.js...");
  
  const mainJsPath = path.join(".", "dist", "main.js");
  if (fs.existsSync(mainJsPath)) {
    let envInitCode = "\n// --- ENV VARS ENGESSADOS DO .ENV ---\n";
    envVars.forEach(({ key, val }) => {
      envInitCode += `process.env['${key}'] = '${val}';\n`;
    });
    envInitCode += "// ----------------------------------\n\n";
    
    const originalCode = fs.readFileSync(mainJsPath, "utf8");
    // Previne duplicação caso rode várias vezes
    if (!originalCode.includes("// --- ENV VARS ENGESSADOS DO .ENV ---")) {
      fs.writeFileSync(mainJsPath, envInitCode + originalCode, "utf8");
      console.log("💉 Variáveis aplicadas com sucesso no topo de main.js!");
    } else {
      console.log("⚠️ As variáveis engessadas já haviam sido aplicadas no main.js.");
    }
  } else {
    console.warn("⚠️ Arquivo dist/main.js não encontrado para injeção do .env");
  }
}

import os from "os";
const nexeDist = path.join(os.homedir(), ".nexe", "20.20.0", "dist");
if (!fs.existsSync(nexeDist)) {
  fs.mkdirSync(nexeDist, { recursive: true });
}

compile({
  input: "./dist/main.js",
  output: `./package/SmartMonitor_v${version}.exe`,
  build: true,
  verbose: true,
  ico: "./icon.ico"
})
  .then(() => {
    console.log(`✅ Compilação Finalizada! Versão: ${version}`);
    console.log(`📂 Local: ./package/SmartMonitor_v${version}.exe`);

    // Copiar os bindings nativos (.node) que o Nexe não empacota no VFS
    const srcBinding = "./node_modules/@journeyapps/sqlcipher/lib/binding";
    const destBinding = "./package/node_modules/@journeyapps/sqlcipher/lib/binding";
    
    if (fs.existsSync(srcBinding)) {
      console.log("⚙️ Copiando Native Bindings (SQLCipher) para a pasta ./package...");
      fsExtra.copySync(srcBinding, destBinding);
      console.log(`✅ Bindings copiados com sucesso!`);
    } else {
      console.warn("⚠️ Pasta de bindings nativos não encontrada no projeto.");
    }
  })
  .catch((err) => {
    console.error("❌ Erro na compilação Nexe:", err);
  });
