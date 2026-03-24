# Investments

Projeto full stack para gerenciamento de investimentos, organizado em workspace com modulos independentes.

## Sobre o projeto

Este repositorio representa uma proposta de solucao para o desafio tecnico da Coderockr:

- Desafio original: `https://github.com/Coderockr/backend-test`

O foco principal da proposta esta no modulo `backend/`, com regras de negocio para usuarios, investimentos, rendimento e saque com tributacao por tempo de aplicacao. O modulo `frontend/` foi adicionado para facilitar a validacao funcional do fluxo completo.

## Objetivo da solucao

- Implementar uma API de investimentos com regras de dominio claras e validacao consistente.

## Tecnologias utilizadas

### Backend

- Node.js 20+
- TypeScript
- Fastify
- Prisma ORM
- SQLite (ambiente local)
- Zod
- dotenv
- Swagger/OpenAPI (`@fastify/swagger` e `@fastify/swagger-ui`)

### Frontend

- React
- Vite
- TypeScript

## Arquitetura do projeto

### Visao geral

- `backend/`: API REST com regras de dominio e persistencia.
- `frontend/`: interface web para operacao dos casos de uso da API.
- raiz: orquestracao dos modulos via scripts npm.

### Backend por camadas

- `src/routes`: definicao de endpoints HTTP e contrato de entrada/saida.
- `src/services`: orquestracao dos casos de uso e regras de aplicacao.
- `src/domain`: funcoes de regra de negocio (ex.: calculos financeiros).
- `src/models`: schemas e validacoes de dados com Zod.
- `src/time`: abstracao de relogio (sistema e clock de teste).
- `src/plugins`: plugins da aplicacao (Swagger).
- `src/lib`: integracoes basicas (Prisma Client).
- `prisma/`: schema e migrations do banco.

## Estrutura de pastas

```text
investments/
|- backend/
|  |- prisma/
|  |- src/
|  |  |- domain/
|  |  |- lib/
|  |  |- models/
|  |  |- plugins/
|  |  |- routes/
|  |  |- services/
|  |  |- time/
|  |  `- server.ts
|  `- README.md
|- frontend/
|  `- src/
`- README.md
```

## Setup

### Pre-requisitos

- Node.js 20+
- npm

### 1) Clonar repositorio

```bash
git clone <url-do-repositorio>
cd investments
```

### 2) Instalar dependencias

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 3) Configurar ambiente do backend

Copie `backend/.env.example` para `backend/.env` e ajuste, se necessario:

```env
DATABASE_URL="file:./dev.db"
ENABLE_TEST_TIME_API="true"
NODE_ENV="test"
```

### 4) Gerar client e aplicar migrations

```bash
npm run generate --prefix backend
npm run migrate --prefix backend
```

## Como rodar o projeto

### Backend somente

```bash
npm run dev:backend
```

API em `http://localhost:3000`.

### Frontend somente

```bash
npm run dev:frontend
```

Interface em `http://localhost:5173` (porta padrao do Vite).

### Backend + Frontend juntos

```bash
npm run dev
```

## Testes e validacoes

### Backend

```bash
npm run typecheck --prefix backend
npm run test --prefix backend
```

## Documentacao da API (Swagger)

Com o backend em execucao:

- UI interativa: `http://localhost:3000/documentation`

## Referencias adicionais

- Detalhes tecnicos do backend: `backend/README.md`
- Desafio base desta solucao: `https://github.com/Coderockr/backend-test`
