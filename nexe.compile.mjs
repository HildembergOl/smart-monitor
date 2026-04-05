import { compile } from "nexe";

compile({
  input: "./dist/main.js",
  output: `./package/SmartMonitor_release_${new Date().getTime()}.exe`,
  build: true, // required to use patches
  verbose: true,
  ico: "./DevSmart.ico",
  patches: [
    async (compiler, next) => {
      // Caso queira virtualizar algo no binário futuramente
      return next();
    },
  ],
}).then(() => {
  console.log("Compilação com Nexe finalizada com sucesso!");
}).catch(err => {
  console.error("Erro na compilação Nexe:", err);
});
