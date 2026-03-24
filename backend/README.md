# Backend - Investments API

API de gerenciamento de investimentos desenvolvida em Node.js com Fastify, Prisma e SQLite.

Este modulo concentra a lógica de:
- cadastro e consulta de usuários
- criação e listagem de investimentos
- cálculo de rendimento composto mensal
- saque total com tributação por faixa de tempo
- suporte a testes de tempo controlado (test-only)

## Build / Run / Test

### Pré-requisitos
- Node.js 20+
- npm

### 1) Instalar dependências

```bash
npm install
```

### 2) Configurar ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
DATABASE_URL="file:./dev.db"
ENABLE_TEST_TIME_API="false"
NODE_ENV="development"
```

Notas:
- `ENABLE_TEST_TIME_API=true` habilita endpoints de controle de tempo (somente para testes locais).
- Em produção, mantenha `ENABLE_TEST_TIME_API=false`.

### 3) Gerar cliente Prisma

```bash
npm run generate
```

### 4) Aplicar migrations

```bash
npm run migrate
```

### 5) Subir servidor

```bash
npm run dev
```

### 6) Verificar tipos

```bash
npm run typecheck
```

### 7) Executar testes

```bash
npm run test
```

## Bibliotecas utilizadas e por que foram escolhidas

- `fastify`
  - Framework HTTP rápido, simples de manter e com bom suporte a TypeScript.

- `prisma` + `@prisma/client`
  - ORM com tipagem forte, migrations versionadas e integração direta com regras de domínio.

- `@prisma/adapter-better-sqlite3`
  - Adaptador para SQLite local com boa performance para desenvolvimento e testes.

- `zod`
  - Validação de entrada nos endpoints com mensagens claras e schemas reutilizáveis.

- `dotenv`
  - Gerenciamento de variáveis de ambiente por arquivo `.env`.

- `tsx`
  - Execução de TypeScript em desenvolvimento e runner de testes com `node:test`.

- `typescript`
  - Segurança de tipos no domínio financeiro e redução de regressões.

## Documentação da API (Swagger)

A API é documentada com Swagger/OpenAPI e pode ser acessada localmente pelos seguintes endpoints:

- UI interativa: `http://localhost:3000/documentation`
- JSON OpenAPI: `http://localhost:3000/documentation/json`
- YAML OpenAPI: `http://localhost:3000/documentation/yaml`

A documentação contém os contratos de request/response das rotas de usuários, investimentos, saques e também das rotas de tempo para testes quando habilitadas.

### Como habilitar a documentação de rotas test-only

Para exibir as rotas de tempo de teste (`/api/test/...`) na documentação, rode o backend com uma das opções:

- `ENABLE_TEST_TIME_API=true`, ou
- `NODE_ENV=test`

Essas rotas devem permanecer desabilitadas em produção.
