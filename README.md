# Controller Financeiro

Sistema full stack de controle financeiro mensal com visual de planilha, autenticacao, upload de comprovantes, geracao de PDF e envio por e-mail.

## Visao geral

Esse projeto junta:

- `React + Vite` no frontend
- `Node.js + Express` no backend
- `MySQL + Sequelize` no banco de dados
- organizacao em `MVC` no backend
- autenticacao com `e-mail/senha` e `Google`
- geracao de `PDF` a partir do HTML da planilha

## O que existe no sistema

- cadastro com nome, e-mail e senha
- login local
- login com Google
- opcao `Lembre de mim` por 30 dias
- abas mensais de janeiro a dezembro
- saldo carregado de um mes para o seguinte
- lancamentos com deposito, debito e credito
- upload de comprovantes
- miniatura da nota dentro da planilha
- envio do PDF mensal por e-mail
- envio dos comprovantes junto com o PDF
- cadastro de destinos de e-mail
- municipio editavel por mes
- observacoes por mes

## Regra de negocio

A conta do mes segue esta leitura:

- `saldo final = saldo anterior + depositos - debitos`
- `credito` fica registrado, mas nao altera o saldo final
- `deposito` entra como valor disponivel, nao como gasto
- saldo positivo indica que o usuario deve para a empresa
- saldo negativo indica que a empresa deve para o usuario

## Estrutura

```text
Controller/
|- client/   frontend React
|- server/   backend Express + Sequelize
`- README.md
```

## Arquivos principais

Frontend:

- [client/src/App.jsx](/c:/Users/BepoO/Desktop/Controller/client/src/App.jsx)
- [client/src/pages/DashboardPage.jsx](/c:/Users/BepoO/Desktop/Controller/client/src/pages/DashboardPage.jsx)
- [client/src/components/MonthlySheet.jsx](/c:/Users/BepoO/Desktop/Controller/client/src/components/MonthlySheet.jsx)
- [client/src/components/TransactionForm.jsx](/c:/Users/BepoO/Desktop/Controller/client/src/components/TransactionForm.jsx)
- [client/src/context/AuthContext.jsx](/c:/Users/BepoO/Desktop/Controller/client/src/context/AuthContext.jsx)

Backend:

- [server/src/server.js](/c:/Users/BepoO/Desktop/Controller/server/src/server.js)
- [server/src/app.js](/c:/Users/BepoO/Desktop/Controller/server/src/app.js)
- [server/src/routes/index.js](/c:/Users/BepoO/Desktop/Controller/server/src/routes/index.js)
- [server/src/controllers/monthController.js](/c:/Users/BepoO/Desktop/Controller/server/src/controllers/monthController.js)
- [server/src/controllers/transactionController.js](/c:/Users/BepoO/Desktop/Controller/server/src/controllers/transactionController.js)
- [server/src/services/financeService.js](/c:/Users/BepoO/Desktop/Controller/server/src/services/financeService.js)
- [server/src/services/pdfService.js](/c:/Users/BepoO/Desktop/Controller/server/src/services/pdfService.js)

## Ambiente

Os exemplos de ambiente ficam aqui:

- [server/.env.example](/c:/Users/BepoO/Desktop/Controller/server/.env.example)
- [client/.env.example](/c:/Users/BepoO/Desktop/Controller/client/.env.example)

A ideia desses arquivos agora e servir como referencia de cada variavel.
Cada linha ja vem acompanhada de uma descricao curta, no estilo:

```env
# Chave de acesso usada na assinatura dos tokens JWT
JWT_SECRET=troque_esta_chave
```

## Banco de dados

O nome esperado para o banco e:

```sql
CREATE DATABASE controller_financeiro;
```

O projeto usa `sequelize.sync({ alter: true })`, entao o backend cria ou ajusta as tabelas quando sobe.

As tabelas principais sao:

- `users`
- `financial_months`
- `transactions`
- `recipient_emails`

## Execucao local

As dependencias do projeto inteiro sao instaladas pela raiz:

```bash
npm run install:all
```

O backend costuma rodar em:

```bash
npm run dev:server
```

O frontend costuma rodar em:

```bash
npm run dev:client
```

Enderecos esperados:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3333`
- healthcheck: `http://localhost:3333/health`

## Fluxo de uso

### Cadastro

O nome informado no cadastro e o mesmo nome mostrado na planilha e no PDF.

### Login

O acesso pode acontecer por:

- e-mail e senha
- conta Google

Quando `Lembre de mim` estiver ativo:

- a sessao dura ate 30 dias
- cada novo acesso dentro desse prazo renova esse periodo

### Planilha

Cada mes carrega:

- municipio
- saldo anterior
- lancamentos
- observacoes
- totais por categoria
- saldo final

As secoes visuais da planilha sao:

- `DEPOSITOS`
- `DESPESAS COM VEICULO`
- `OUTRAS DESPESAS`

### Lancamentos

Os campos principais sao:

- categoria
- data
- descricao
- numero da nota
- tipo de movimento
- valor
- foto da nota

No caso de `Depositos`:

- a descricao vira `Deposito em conta`
- o numero da nota fica vazio e bloqueado
- o tipo de movimento fica bloqueado

### Comprovantes

As imagens podem seguir dois caminhos:

- Cloudinary, quando as credenciais estiverem presentes
- pasta local `server/uploads`, quando o projeto estiver sem Cloudinary

Os nomes dos comprovantes anexados no e-mail seguem este padrao:

- `data - numero da nota - categoria.extensao`

Exemplo:

- `16-03-2026 - 1234 - veiculos.jpg`

### Envio por e-mail

Quando o relatorio mensal e enviado:

- o sistema gera o PDF
- anexa os comprovantes daquele mes
- envia tudo para o destino preenchido

Tambem existe:

- preenchimento manual do e-mail
- lista de destinos salvos
- reaproveitamento desses destinos em envios futuros

## Login com Google

O projeto espera:

- `GOOGLE_CLIENT_ID` no backend
- `VITE_GOOGLE_CLIENT_ID` no frontend

Esse client id vem do Google Cloud.

## SMTP

O envio de e-mail depende destas variaveis:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

No Gmail, o uso mais comum e com `senha de app`.

## API

Autenticacao:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`

Meses:

- `GET /api/months?year=2026`
- `GET /api/months/:year/:month`
- `PUT /api/months/:year/:month`
- `POST /api/months/:year/:month/send-report`

Lancamentos:

- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

Destinos de e-mail:

- `GET /api/recipient-emails`
- `POST /api/recipient-emails`
- `DELETE /api/recipient-emails/:id`

## Comportamentos importantes

### Ano futuro

O sistema nao permite trabalhar com anos futuros.

### Meses futuros do ano atual

Os meses futuros continuam visiveis, mas ficam bloqueados para edicao ate o calendario chegar neles.

### Ordenacao

Dentro de cada categoria, os itens aparecem em ordem crescente:

- primeiro por data
- depois por descricao

### Saldo entre meses

O saldo final de um mes e carregado como saldo inicial do mes seguinte.

## Pontos de apoio

Quando algo parecer estranho, estes lugares costumam ser os mais uteis:

- [server/src/services/financeService.js](/c:/Users/BepoO/Desktop/Controller/server/src/services/financeService.js)
- [server/src/services/pdfService.js](/c:/Users/BepoO/Desktop/Controller/server/src/services/pdfService.js)
- [server/src/controllers/transactionController.js](/c:/Users/BepoO/Desktop/Controller/server/src/controllers/transactionController.js)
- [client/src/pages/DashboardPage.jsx](/c:/Users/BepoO/Desktop/Controller/client/src/pages/DashboardPage.jsx)
- [client/src/components/TransactionForm.jsx](/c:/Users/BepoO/Desktop/Controller/client/src/components/TransactionForm.jsx)

## Scripts

```bash
npm run install:all
npm run dev
npm run dev:server
npm run dev:client
npm run build
```

## Fechamento

Hoje o projeto esta preparado para:

- uso local
- validacao visual da planilha
- geracao de PDF no mesmo formato da tela
- envio de relatorio por e-mail com comprovantes

O README agora segue um tom mais descritivo e os arquivos `.env.example` funcionam como uma legenda viva das variaveis do projeto.
