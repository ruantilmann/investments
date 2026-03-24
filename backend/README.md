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

## Endpoints de tempo para testes (test-only)

### Motivação

No cenário de investimentos, algumas regras dependem da passagem de tempo (rendimento composto mensal e faixas de tributação por idade do investimento).

Para validar corretamente esses cenários sem esperar meses reais, adotamos uma estratégia de relógio controlado (`Clock`) com implementação fake para testes. Isso permite simular avanço de tempo de forma determinística e repetir testes sempre com o mesmo resultado.

### Estratégia adotada

- `SystemClock`: relógio real para execução normal.
- `FakeClock`: relógio controlado para testes.
- `clockProvider`: seleciona automaticamente o relógio de teste quando:
  - `NODE_ENV=test`, ou
  - `ENABLE_TEST_TIME_API=true`.

Com isso, conseguimos:
- testar cálculo de rendimento e imposto com previsibilidade
- reproduzir cenários de borda (12 meses, 24 meses etc.)
- manter produção segura sem dependência de endpoint de tempo

### Segurança

As rotas abaixo só são registradas em ambiente controlado (`NODE_ENV=test` ou `ENABLE_TEST_TIME_API=true`).

### Base das rotas

`/api/test`

### Rotas disponíveis

- `GET /api/test/time`
  - Retorna a data atual do relógio de teste.

- `POST /api/test/time/set`
  - Define data absoluta do relógio.
  - Payload:

```json
{
  "date": "2026-01-15T00:00:00.000Z"
}
```

- `POST /api/test/time/advance-months`
  - Avança o relógio em meses.
  - Payload:

```json
{
  "months": 1
}
```

- `POST /api/test/time/advance-days`
  - Avança o relógio em dias.
  - Payload:

```json
{
  "days": 10
}
```

- `POST /api/test/time/reset`
  - Reseta o relógio para o horário atual da máquina.

## Endpoints principais da API

### Usuários
- `POST /api/users/newUser`
- `GET /api/users/allUsers`
- `GET /api/users/:id`
- `GET /api/users/search?name=...`
- `GET /api/users/searchByEmail?email=...`

### Investimentos
- `POST /api/investments/newInvestment`
- `GET /api/investments/user/:userId?page=1&limit=10&status=ACTIVE`
- `GET /api/investments/user/:userId/summary`
- `GET /api/investments/:investmentId`

### Saque
- `POST /api/withdraw/newWithdraw`

## Documentação da API

Atualmente a documentação está centralizada neste README.

### Exemplo do endpoint de summary

`GET /api/investments/user/4/summary`

Resposta:

```json
{
  "userId": 4,
  "totalInvested": "1500.00",
  "totalActiveInvested": "500.00",
  "totalExpectedBalanceActive": "513.13",
  "totalWithdrawnGross": "1067.89",
  "totalWithdrawnNet": "1055.33",
  "totalTaxPaid": "12.56",
  "countInvestments": 2,
  "countActive": 1,
  "countWithdrawn": 1
}
```
