# Smart Monitor & Backup 🛡️

O **Smart Monitor** é um serviço backend inteligente de monitoramento e rotinas automáticas para bancos de dados **SQL Server**, projetado para garantir a integridade, saúde e segurança dos dados através de uma interface CLI de alta performance e sincronização resiliente com a Nuvem.

## 🚀 Principais Recursos

- **Monitoramento 24/7**: Captura contínua de métricas de saúde (CPU, Memória, Sessões, Deadlocks).
- **Checks de Integridade Automáticos**: Execução programada de `DBCC CHECKDB`, `CHECKALLOC`, etc., em horários de baixa demanda.
- **Sincronização Cloud (Store-And-Forward)**: Todas as métricas são salvas localmente em um buffer SQLite criptografado e sincronizadas com a Nuvem (Grafana ready) a cada 5 minutos.
- **Segurança de Dados**: Banco local protegido com criptografia de nível de arquivo via **SQLCipher**.
- **Interface CLI Integrada**: Dashboard no terminal com comandos rápidos (`CTRL + R` para configurações) via Raw Mode.

## 🛠 Tecnologias Utilizadas

- **Core**: Node.js + TypeScript (`tsx`)
- **Database Local**: SQLite (Protegido com `@journeyapps/sqlcipher`)
- **Database Alvo/Remoto**: Microsoft SQL Server (`mssql`)
- **Agendamento**: `node-cron`
- **Compressão**: `archiver`

## 🏗 Arquitetura

O sistema opera em um modelo de **Buffer Seguro**. Caso a internet do cliente oscile, os logs e métricas não se percam; eles aguardam no SQLite local (`synced = 0`) até que a conexão com o banco remoto seja restabelecida.

### Atalhos Úteis (CLI)
- `CTRL + R`: Pausa o monitoramento e abre o Menu de Configuração.
- `CTRL + C`: Aciona o *Graceful Shutdown* (salvando logs de encerramento).

## ⚙️ Configuração Rapida

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie a aplicação:
   ```bash
   npm run start
   ```
3. Siga o assistente de configuração no terminal para definir as instâncias local e remota.

## 🗄️ Esquema de Dados (Cloud)

Os dados são sincronizados para quatro tabelas principais para consumo via Grafana:
- `METRICS`: Gráficos de performance.
- `CHECKS_LOG`: Status histórico de integridade (Verde/Vermelho).
- `BACKUP_LOG`: Grade de conferência de backups (Full/Diff/Trans).
- `ALERTS`: Tabela consolidada de erros críticos e avisos.

## 📦 Compilação (Executável)

O projeto está configurado para gerar um executável Windows (`.exe`) independente, utilizando o **Nexe**.

### Como gerar o pacote:
1. Compile o TypeScript e gere o executável:
   ```bash
   npm run nexe
   ```
   > **Nota**: Este comando aumenta automaticamente a versão no `package.json` (`npm version patch`).
2. O arquivo será gerado na pasta `/package` com o nome `SmartMonitor_v1.x.x.exe`.

> **Ícone**: O executável utiliza o ícone oficial `icon.ico` localizado na raiz.

> **Nota sobre Módulos Nativos**: Como o projeto usa `SQLCipher`, certifique-se de que a estrutura de `node_modules` necessária esteja presente caso o executável exiba erros de carregamento de driver binário em ambientes limpos.

---
Desenvolvido com foco em **Estabilidade** e **Baixo Overhead**.
