# Investments

Projeto em estrutura modular para gerenciamento de investimentos.

Este repositório foi pensado para centralizar diferentes modulos da aplicacao, como `backend` e futuros modulos como `frontend`. A documentação detalhada de cada modulo sera mantida em arquivos `README.md` proprios dentro de cada pasta, enquanto este arquivo da raiz apresenta apenas uma visao geral do projeto.

## Tecnologias utilizadas

Atualmente, o projeto utiliza as seguintes tecnologias:

- Node.js
- TypeScript
- Fastify
- Prisma ORM
- SQLite (Será alterado para postgres)
- Zod
- dotenv
- concurrently

## Estrutura atual

Hoje o repositorio possui o modulo:

- `backend/`: API da aplicacao

Futuros modulos, como `frontend/`, poderao ser adicionados e documentados separadamente.

## Setup do projeto

### 1. Clonar o repositorio

```bash
git clone <url-do-repositorio>
cd investments
```

### 2. Instalar dependencias da raiz

```bash
npm install
```

### 3. Instalar dependencias do backend

```bash
cd backend
npm install
```

### 4. Configurar variaveis de ambiente

No modulo `backend`, garanta que exista um arquivo `.env` com a configuracao do banco:

```env
DATABASE_URL="file:./dev.db"

# Habilita endpoints de controle de tempo apenas para testes locais
ENABLE_TEST_TIME_API="true"
```

### 5. Gerar o client do Prisma

Ainda dentro de `backend`:

```bash
npm run generate
```

### 6. Criar ou atualizar o banco com as migrations

```bash
npm run migrate -- --name init
```

### 7. Subir o backend

```bash
npm run dev
```

## Comandos disponiveis

### Na raiz do projeto

`npm run dev`

Comando pensado para subir multiplos modulos em paralelo, como `backend` e `frontend`. Deve ser usado quando todos os modulos esperados pelo workspace estiverem implementados e configurados.

`npm run dev:backend`

Inicia apenas o backend a partir da raiz do projeto.

`npm run dev:frontend`

Comando reservado para iniciar o frontend a partir da raiz, quando esse modulo estiver disponivel.

### No modulo `backend/`

`npm run dev`

Inicia o servidor backend em modo de desenvolvimento com recarga automatica.

`npm run generate`

Gera o Prisma Client com base no schema atual.

`npm run migrate`

Executa as migrations do banco de dados com Prisma.

`npm run test`

Executa os testes unitarios e de servicos no backend.

## Endpoints de tempo para testes (test-only)

Quando `ENABLE_TEST_TIME_API="true"` (ou `NODE_ENV=test`), o backend expõe rotas auxiliares para simular passagem de tempo. Elas não devem ser habilitadas em producao.

### Base

`/api/test`

### Rotas

- `GET /api/test/time`
  - Retorna a data atual do clock de testes.
- `POST /api/test/time/set`
  - Define data absoluta.
  - Payload:

```json
{
  "date": "2026-01-15T00:00:00.000Z"
}
```

- `POST /api/test/time/advance-months`
  - Avança o tempo em meses.
  - Payload:

```json
{
  "months": 1
}
```

- `POST /api/test/time/advance-days`
  - Avança o tempo em dias.
  - Payload:

```json
{
  "days": 10
}
```

- `POST /api/test/time/reset`
  - Reseta o clock de testes para `now`.

## Observacoes

- Este README e propositalmente geral.
- A documentacao tecnica detalhada de cada modulo sera mantida dentro da propria pasta do modulo.
- Para evolucoes futuras, a recomendacao e manter a raiz como ponto de entrada do workspace e os detalhes de implementacao separados por contexto.
