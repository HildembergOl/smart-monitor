# Smart Monitor & Backup

## 📌 Escopo do Projeto
O **Smart Monitor** é uma aplicação backend e CLI (Command Line Interface) de monitoramento e serviço de rotinas para bancos de dados SQL Server. 
O projeto foi desenvolvido para funcionar continuamente ("24/7") como um serviço, capturando métricas do banco de dados do cliente localmente, executando comandos pesados de integridade (DBCC) de forma não-intrusiva durante horários programados, e sincronizando todos os dados com um banco Cloud Remoto (para exibição via Grafana).

---

## 🛠 Tecnologias Utilizadas
- **Linguagem Principal:** Node.js com TypeScript (`tsx` para execução moderna e limpa de arquivos `.ts`).
- **Banco de Dados Local (Buffer e Config.):** `sqlite3`
  - Utilizado como área de "Buffer Seguro" ("Store-and-Forward") garantindo que métricas não se percam caso a internet do cliente caia.
- **Banco de Dados Alvo (Remote & Local):** `mssql` (Driver Oficial do SQL Server)
- **Agendamento de Tarefas:** `node-cron`
- **Interface de Terminal (CLI):** Modos brutos do teclado (`process.stdin.setRawMode`) integrados com o pacote nativo `readline`. 
- **Backups:** `archiver` (para empacotamento)
- **Notificação / Alertas:** Integrações contidas no módulo lib `notifier.ts` (bem como injeção direta de `WARNING` e `CRITICAL` via banco).

---

## 🏗 Arquitetura e Regras de Negócios

### 1. Interface Administrativa (CLI)
- Ao inicializar com `npm run start`, a aplicação fica ativa em segundo plano de forma silenciosa.
- Não existem "Páginas CSS/HTML", porém a aplicação exibe um dashboard no próprio Terminal através de atalhos em Raw Mode:
  - **`CTRL + R`**: Interrompe temporariamente a tela para acionar o **Menu de Configuração**.
  - **`CTRL + C`**: Inicia o processo de *Graceful Shutdown* (Encerramento elegante, permitindo que o sistema grave logs no SQLite de que a aplicação foi desligada de propósito).

### 2. Monitoramento de Saúde & Integridade
- **Verificações Diárias (`0 6 * * *`):** 
  - Executa nativamente `DBCC CHECKDB`, `CHECKALLOC`, `CHECKCATALOG`, `CHECKCONSTRAINTS` e `CHECKFILEGROUP` na base de dados conectada.
  - Varre o histórico de erros interno do SQL via `xp_readerrorlog` e intercepta logs.
  - Verifica o calendário de Backups (garantindo que tipos e prazos foram cumpridos).
- **Métricas Curtas (`*/15 * * * *`):** 
  - Coleta a cada 15 min CPU, Memória, Deadlocks e tempo de Queries.

### 3. Sincronização Cloud (Design "Store-And-Forward")
- Para evitar interrupções de internet em clientes espalhados, todas as métricas são **salvas localmente no SQLite** na hora (`synced = 0`).
- A rotina (`synchronizer.ts`) acorda a cada 5 Minutos. Ele coleta pacotes pendentes (`synced=0`) e insere (`INSERT`) no SQL Server na Nuvem. Após gravado com sucesso, marca `synced = 1`. 
- Em caso de falha de conexão na Nuvem, é emitido um alerta (`ALERTS` SQLite) alertando que está Inacessível, protegendo os dados sem criar duplicações.

### 4. Global Error Handling
- A aplicação é "Blindada" contra o fechamento súbito ou travamentos misteriosos.
- Utiliza bloqueadores como `uncaughtException` e `unhandledRejection` (inseridos no `main.ts`), que interceptam problemas gravíssimos do Event Loop e garantem que a tabela `ALERTS` seja sempre populada, sinalizando quem sofreu a pane antes da eventual finalização da Thread.

---

## 🗄️ Design System & Data Schema
*(Como não há frontend UI tradicional, o "Design System" engloba a estrutura dos Artefatos de Logs).*

- O arquivo principal do painel em Nuvem (para integração com o **Grafana**) baseia-se em 4 grandes pilares visuais que derivam dessas tabelas Cloud:
  1. **METRICS**: Indicadores Lineares em Gráficos (CPU, Uso Memória, Sessões, Deadlocks). 
  2. **CHECKS_LOG**: Tabelas Vermelho/Verde do DBCC sinalizando OK ou FAIL por cliente.
  3. **BACKUP_LOG**: Grade para atestar se existe backup (last_backup) com sucesso de transações/Diff/Full.
  4. **ALERTS**: Tabela de notificação textual onde os crashs, perdas de conexão com a cloud ou falhas internas aparecem categorizados como `CRITICAL` ou `WARNING`.
