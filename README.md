# Controller Financeiro

Sistema full stack para controle financeiro mensal com visual de planilha, autenticação, upload de comprovantes, geração de PDF e envio por e-mail.

## Visão geral

O projeto foi construído com:

- `React + Vite` no frontend
- `Node.js + Express` no backend
- `MySQL + Sequelize` no banco de dados
- organização em `MVC` no backend
- autenticação com `e-mail/senha` e `Google`
- geração de `PDF` a partir do HTML da própria planilha

## Principais funcionalidades

- cadastro com `nome`, `e-mail` e `senha`
- login com conta local
- login com conta Google
- opção `Lembre de mim` com renovação de sessão por 30 dias
- abas mensais de janeiro a dezembro
- saldo carregado de um mês para o seguinte
- cadastro de lançamentos por categoria
- upload de foto da nota/comprovante
- miniatura da imagem na planilha
- envio do PDF mensal por e-mail
- envio dos comprovantes junto com o PDF
- cadastro e reutilização de e-mails de destino
- campo editável de município por mês
- CRUD de lançamentos
- observações por mês

## Regra de negócio

O sistema usa a seguinte lógica financeira:

- `saldo final = saldo anterior + depositos - debitos`
- lançamentos do tipo `credito` não entram no saldo final
- `deposito` não entra como gasto no débito
- saldo positivo indica que o usuário deve para a empresa
- saldo negativo indica que a empresa deve para o usuário

## Estrutura do projeto

```text
Controller/
├─ client/   # frontend React
├─ server/   # backend Express + Sequelize
└─ README.md
```

### Frontend

Arquivos principais:

- [client/src/App.jsx](/c:/Users/BepoO/Desktop/Controller/client/src/App.jsx)
- [client/src/pages/DashboardPage.jsx](/c:/Users/BepoO/Desktop/Controller/client/src/pages/DashboardPage.jsx)
- [client/src/components/MonthlySheet.jsx](/c:/Users/BepoO/Desktop/Controller/client/src/components/MonthlySheet.jsx)
- [client/src/components/TransactionForm.jsx](/c:/Users/BepoO/Desktop/Controller/client/src/components/TransactionForm.jsx)
- [client/src/context/AuthContext.jsx](/c:/Users/BepoO/Desktop/Controller/client/src/context/AuthContext.jsx)

### Backend

Arquivos principais:

- [server/src/server.js](/c:/Users/BepoO/Desktop/Controller/server/src/server.js)
- [server/src/app.js](/c:/Users/BepoO/Desktop/Controller/server/src/app.js)
- [server/src/routes/index.js](/c:/Users/BepoO/Desktop/Controller/server/src/routes/index.js)
- [server/src/controllers/monthController.js](/c:/Users/BepoO/Desktop/Controller/server/src/controllers/monthController.js)
- [server/src/controllers/transactionController.js](/c:/Users/BepoO/Desktop/Controller/server/src/controllers/transactionController.js)
- [server/src/services/financeService.js](/c:/Users/BepoO/Desktop/Controller/server/src/services/financeService.js)
- [server/src/services/pdfService.js](/c:/Users/BepoO/Desktop/Controller/server/src/services/pdfService.js)

## Requisitos

Antes de rodar, tenha instalado:

- `Node.js`
- `npm`
- `MySQL`

Opcional, para recursos extras:

- conta Google Cloud para login com Google
- conta SMTP para envio de e-mails
- conta Cloudinary para armazenar imagens na nuvem

## Instalação

Na raiz do projeto:

```bash
npm run install:all
```

## Configuração de ambiente

### Backend

Copie [server/.env.example](/c:/Users/BepoO/Desktop/Controller/server/.env.example) para `server/.env`.

Exemplo:

```env
PORT=3333
CLIENT_URL=http://localhost:5173
SERVER_PUBLIC_URL=http://localhost:3333
JWT_SECRET=troque_esta_chave

DB_HOST=localhost
DB_PORT=3306
DB_NAME=controller_financeiro
DB_USER=root
DB_PASSWORD=admin

GOOGLE_CLIENT_ID=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Controller Financeiro <no-reply@example.com>"

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Frontend

Copie [client/.env.example](/c:/Users/BepoO/Desktop/Controller/client/.env.example) para `client/.env`.

Exemplo:

```env
VITE_API_URL=http://localhost:3333/api
VITE_GOOGLE_CLIENT_ID=
```

## Banco de dados

Crie o banco:

```sql
CREATE DATABASE controller_financeiro;
```

O projeto usa `sequelize.sync({ alter: true })`, então as tabelas são criadas e ajustadas automaticamente quando o backend sobe.

### Principais tabelas

- `users`
- `financial_months`
- `transactions`
- `recipient_emails`

## Como rodar

### Backend

```bash
npm run dev:server
```

ou

```bash
cmd /c "cd server && node src/server.js"
```

### Frontend

```bash
npm run dev:client
```

ou

```bash
cmd /c "cd client && npm run dev"
```

### Endereços

- frontend: `http://localhost:5173`
- backend: `http://localhost:3333`
- healthcheck: `http://localhost:3333/health`

## Fluxo de uso

### 1. Cadastro

Na criação da conta, o sistema solicita:

- nome
- e-mail
- senha

Esse nome cadastrado é o nome que aparece na planilha e no PDF.

### 2. Login

O acesso pode ser feito por:

- e-mail e senha
- conta Google

Se a opção `Lembre de mim` for marcada:

- a sessão é salva por 30 dias
- cada novo acesso dentro desse prazo renova a validade por mais 30 dias
- se passar mais de 30 dias sem acessar, o sistema pede login novamente

### 3. Planilha mensal

Cada mês tem:

- município
- saldo anterior
- lançamentos
- observações
- totais por categoria
- saldo final

As categorias visuais da planilha são:

- `DEPOSITOS`
- `DESPESAS COM VEICULO`
- `OUTRAS DESPESAS`

### 4. Cadastro de lançamento

Campos principais:

- categoria
- data
- descrição
- número da nota
- tipo de movimento
- valor
- foto da nota

Comportamento especial para `Depositos`:

- descrição é preenchida automaticamente como `Deposito em conta`
- número da nota fica vazio e bloqueado
- tipo de movimento fica automaticamente como depósito e bloqueado

### 5. Comprovantes

Ao anexar uma imagem:

- ela pode ser salva no Cloudinary, se configurado
- se o Cloudinary não estiver configurado, ela é salva localmente em `server/uploads`
- a miniatura aparece na planilha
- a imagem segue anexada no e-mail junto com o PDF

Nome dos arquivos anexados:

- formato: `data - numero da nota - categoria.extensao`

Exemplo:

- `16-03-2026 - 1234 - veiculos.jpg`

### 6. Envio por e-mail

Ao enviar o controle financeiro:

- o sistema gera um PDF do mês
- anexa os comprovantes do mês
- envia tudo para o e-mail informado

Também é possível:

- informar um e-mail manualmente
- salvar e-mails de destino
- selecionar destinos salvos em envios futuros

## Configuração do envio de e-mail

O sistema usa SMTP.

Campos obrigatórios no [server/.env.example](/c:/Users/BepoO/Desktop/Controller/server/.env.example):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

### Exemplo com Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=sua_senha_de_app
SMTP_FROM="Controller Financeiro <seuemail@gmail.com>"
```

Importante:

- no Gmail, use `senha de app`
- a senha normal da conta geralmente não funciona

## Configuração do login com Google

Para o login Google funcionar, configure:

- `GOOGLE_CLIENT_ID` no backend
- `VITE_GOOGLE_CLIENT_ID` no frontend

Esse client id deve vir do projeto criado no Google Cloud.

## Armazenamento das imagens

### Com Cloudinary

Se estas variáveis estiverem preenchidas:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

as imagens serão salvas na nuvem.

### Sem Cloudinary

Se o Cloudinary não estiver configurado:

- as imagens são salvas localmente em `server/uploads`
- a API expõe os arquivos em `/uploads/...`

## PDF

O PDF mensal:

- é gerado a partir do HTML da planilha
- segue o mesmo formato visual do site
- inclui município, nome do usuário, categorias e totais do mês

Arquivo principal:

- [server/src/services/pdfService.js](/c:/Users/BepoO/Desktop/Controller/server/src/services/pdfService.js)

## API

### Autenticação

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`

### Meses

- `GET /api/months?year=2026`
- `GET /api/months/:year/:month`
- `PUT /api/months/:year/:month`
- `POST /api/months/:year/:month/send-report`

### Lançamentos

- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

### E-mails de destino

- `GET /api/recipient-emails`
- `POST /api/recipient-emails`
- `DELETE /api/recipient-emails/:id`

## Modelo de dados

### FinancialMonth

Armazena:

- usuário
- ano
- mês
- saldo anterior
- município
- observações

### Transaction

Armazena:

- data da compra
- descrição
- número da nota
- categoria
- tipo
- valor
- URL do comprovante

### Tipos de transação

- `deposito`
- `debito`
- `credito`

### Categorias

- `depositos`
- `veiculos`
- `outras-despesas`

## Comportamentos importantes

### Ano futuro bloqueado

O sistema não permite:

- selecionar ano futuro no frontend
- consultar ano futuro pela API

### Ordenação

Os lançamentos dentro de cada categoria são mostrados em ordem crescente:

- primeiro por data
- depois por descrição

### Saldo automático entre meses

Quando um mês é criado:

- o sistema procura o mês anterior
- calcula o saldo final do mês anterior
- usa esse valor como saldo inicial do mês atual

## Solução de problemas

### A tela fica em branco

Confira:

- se o backend está rodando
- se o MySQL está ativo
- se o `server/.env` está preenchido corretamente

### Erro de SMTP não configurado

Preencha no `server/.env`:

- `SMTP_USER`
- `SMTP_PASS`

### O PDF não envia

Verifique:

- backend ativo
- SMTP configurado
- e-mail de destino válido

### A imagem não aparece

Verifique:

- se o upload foi feito com sucesso
- se a URL do comprovante foi salva
- se a pasta `server/uploads` existe quando o Cloudinary não estiver ativo

## Scripts úteis

Na raiz:

```bash
npm run install:all
npm run dev
npm run dev:server
npm run dev:client
npm run build
```

## Observações finais

- o backend lê automaticamente `server/.env`
- o frontend usa `client/.env`
- o projeto está preparado para uso local e pode ser expandido para deploy
- o PDF atual está alinhado com o formato visual validado no projeto

