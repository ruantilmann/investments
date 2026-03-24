import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createInvestment, cancelInvestment, getInvestmentSummaryByUser, listInvestmentsByUser } from './features/investments/api';
import { createUser, listUsers } from './features/users/api';
import { createWithdraw } from './features/withdraw/api';
import { formatDate, formatMoney, humanizeStatus } from './lib/format';
import { HttpError } from './lib/http';
import type { Investment, InvestmentSummary, User } from './types';

type WalletRegistry = Record<number, number>;

function toIsoFromDateInput(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro inesperado ao processar a requisição.';
}

const emptySummary: InvestmentSummary = {
  userId: 0,
  totalInvested: '0.00',
  totalActiveInvested: '0.00',
  totalExpectedBalanceActive: '0.00',
  totalWithdrawnGross: '0.00',
  totalWithdrawnNet: '0.00',
  totalTaxPaid: '0.00',
  countInvestments: 0,
  countActive: 0,
  countWithdrawn: 0,
};

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [walletRegistry, setWalletRegistry] = useState<WalletRegistry>({});
  const [searchName, setSearchName] = useState('');

  const [summary, setSummary] = useState<InvestmentSummary>(emptySummary);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'WITHDRAWN' | 'CANCELLED'>('ALL');

  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateInvestmentOpen, setIsCreateInvestmentOpen] = useState(false);
  const [isCreateWithdrawOpen, setIsCreateWithdrawOpen] = useState(false);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  const [walletIdInput, setWalletIdInput] = useState('');
  const [initialAmountInput, setInitialAmountInput] = useState('');
  const [investedAtInput, setInvestedAtInput] = useState('');

  const [withdrawInvestmentIdInput, setWithdrawInvestmentIdInput] = useState('');
  const [withdrawDateInput, setWithdrawDateInput] = useState('');
  const [withdrawNotesInput, setWithdrawNotesInput] = useState('');

  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedUser = useMemo(
    () => users.find((item) => item.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const activeInvestments = useMemo(
    () => investments.filter((item) => item.status === 'ACTIVE'),
    [investments],
  );

  async function loadUsers(name?: string) {
    setUsersLoading(true);
    setUsersError(null);

    try {
      const response = await listUsers({ page: 1, limit: 100, ...(name ? { name } : {}) });
      setUsers(response.data);

      if (response.data.length > 0 && !selectedUserId) {
        setSelectedUserId(response.data[0].id);
      }

      if (selectedUserId && !response.data.some((user) => user.id === selectedUserId)) {
        setSelectedUserId(response.data[0]?.id ?? null);
      }
    } catch (error) {
      setUsersError(getErrorMessage(error));
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadInvestmentsAndSummary(userId: number) {
    setDataLoading(true);
    setDataError(null);

    try {
      const [summaryResponse, investmentsResponse] = await Promise.all([
        getInvestmentSummaryByUser(userId),
        listInvestmentsByUser({
          userId,
          page: 1,
          limit: 100,
          ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        }),
      ]);

      setSummary(summaryResponse);
      setInvestments(investmentsResponse.data);
    } catch (error) {
      setDataError(getErrorMessage(error));
      setSummary(emptySummary);
      setInvestments([]);
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setSummary(emptySummary);
      setInvestments([]);
      return;
    }

    void loadInvestmentsAndSummary(selectedUserId);
  }, [selectedUserId, statusFilter]);

  useEffect(() => {
    if (activeInvestments.length > 0 && !withdrawInvestmentIdInput) {
      setWithdrawInvestmentIdInput(String(activeInvestments[0].id));
    }
  }, [activeInvestments, withdrawInvestmentIdInput]);

  useEffect(() => {
    if (selectedUserId && walletRegistry[selectedUserId]) {
      setWalletIdInput(String(walletRegistry[selectedUserId]));
    }
  }, [selectedUserId, walletRegistry]);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGlobalMessage(null);
    setIsSubmitting(true);

    try {
      const created = await createUser({ name: newUserName.trim(), email: newUserEmail.trim() });
      setWalletRegistry((prev) => {
        if (!created.wallet) return prev;
        return { ...prev, [created.id]: created.wallet.id };
      });
      setIsCreateUserOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setGlobalMessage('Usuário criado com sucesso.');
      await loadUsers(searchName.trim() || undefined);
      setSelectedUserId(created.id);
    } catch (error) {
      setGlobalMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateInvestment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGlobalMessage(null);
    setIsSubmitting(true);

    try {
      await createInvestment({
        walletId: Number(walletIdInput),
        initialAmount: Number(initialAmountInput),
        investedAt: toIsoFromDateInput(investedAtInput),
      });
      setIsCreateInvestmentOpen(false);
      setInitialAmountInput('');
      setInvestedAtInput('');
      setGlobalMessage('Investimento criado com sucesso.');
      if (selectedUserId) {
        await loadInvestmentsAndSummary(selectedUserId);
      }
    } catch (error) {
      setGlobalMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateWithdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGlobalMessage(null);
    setIsSubmitting(true);

    try {
      await createWithdraw({
        investmentId: Number(withdrawInvestmentIdInput),
        withdrawDate: toIsoFromDateInput(withdrawDateInput),
        notes: withdrawNotesInput.trim() || undefined,
      });
      setIsCreateWithdrawOpen(false);
      setWithdrawDateInput('');
      setWithdrawNotesInput('');
      setGlobalMessage('Saque realizado com sucesso.');
      if (selectedUserId) {
        await loadInvestmentsAndSummary(selectedUserId);
      }
    } catch (error) {
      setGlobalMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelInvestment(investmentId: number) {
    setGlobalMessage(null);
    setIsSubmitting(true);

    try {
      await cancelInvestment(investmentId);
      setGlobalMessage('Investimento cancelado com sucesso.');
      if (selectedUserId) {
        await loadInvestmentsAndSummary(selectedUserId);
      }
    } catch (error) {
      setGlobalMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Usuarios</h2>
          <button type="button" className="outline-btn" onClick={() => setIsCreateUserOpen(true)}>
            Novo usuário
          </button>
        </div>

        <form
          className="search-row"
          onSubmit={(event) => {
            event.preventDefault();
            void loadUsers(searchName.trim() || undefined);
          }}
        >
          <input
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
            placeholder="Buscar por nome"
          />
          <button type="submit" className="outline-btn">
            Buscar
          </button>
        </form>

        {usersLoading ? <p className="state-text">Carregando usuários...</p> : null}
        {usersError ? <p className="state-text error">{usersError}</p> : null}

        <div className="user-list">
          {users.length === 0 && !usersLoading ? <p className="state-text">Sem usuários cadastrados.</p> : null}

          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              className={`user-item ${user.id === selectedUserId ? 'active' : ''}`}
              onClick={() => setSelectedUserId(user.id)}
            >
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="content">
        <header className="content-header">
          <h1>Resumo de Investimentos</h1>
          <div className="header-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => setIsCreateInvestmentOpen(true)}
              disabled={isSubmitting}
            >
              Novo investimento
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setIsCreateWithdrawOpen(true)}
              disabled={isSubmitting || activeInvestments.length === 0}
            >
              Novo saque
            </button>
          </div>
        </header>

        {globalMessage ? <p className="banner">{globalMessage}</p> : null}

        <section className="cards-grid">
          <article className="card">
            <span>Total investido</span>
            <strong>{formatMoney(summary.totalInvested)}</strong>
          </article>
          <article className="card">
            <span>Saldo esperado ativo</span>
            <strong>{formatMoney(summary.totalExpectedBalanceActive)}</strong>
          </article>
          <article className="card">
            <span>Total sacado líquido</span>
            <strong>{formatMoney(summary.totalWithdrawnNet)}</strong>
          </article>
          <article className="card">
            <span>Imposto pago</span>
            <strong>{formatMoney(summary.totalTaxPaid)}</strong>
          </article>
        </section>

        <section className="table-panel">
          <div className="table-toolbar">
            <h3>Investimentos do usuário</h3>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Ativos</option>
              <option value="WITHDRAWN">Sacados</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
          </div>

          {!selectedUser ? <p className="state-text">Selecione um usuário para ver os investimentos.</p> : null}
          {dataLoading ? <p className="state-text">Carregando investimentos...</p> : null}
          {dataError ? <p className="state-text error">{dataError}</p> : null}

          {selectedUser && !dataLoading && !dataError ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Valor inicial</th>
                    <th>Valor atual</th>
                    <th>Rendimento</th>
                    <th>Data investimento</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-cell">
                        Nenhum investimento encontrado para este filtro.
                      </td>
                    </tr>
                  ) : (
                    investments.map((investment) => (
                      <tr key={investment.id}>
                        <td>{investment.id}</td>
                        <td>{formatMoney(investment.initialAmount)}</td>
                        <td>{formatMoney(investment.currentAmount)}</td>
                        <td>{formatMoney(investment.yieldAmount)}</td>
                        <td>{formatDate(investment.investedAt)}</td>
                        <td>
                          <span className={`status-pill ${investment.status.toLowerCase()}`}>
                            {humanizeStatus(investment.status)}
                          </span>
                        </td>
                        <td>
                          {investment.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              className="link-danger"
                              onClick={() => void handleCancelInvestment(investment.id)}
                              disabled={isSubmitting}
                            >
                              Cancelar
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </main>

      {isCreateUserOpen ? (
        <div className="modal-overlay">
          <form className="modal" onSubmit={handleCreateUser}>
            <h3>Novo usuário</h3>
            <label>
              Nome
              <input value={newUserName} onChange={(event) => setNewUserName(event.target.value)} required />
            </label>
            <label>
              Email
              <input
                value={newUserEmail}
                type="email"
                onChange={(event) => setNewUserEmail(event.target.value)}
                required
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="outline-btn" onClick={() => setIsCreateUserOpen(false)}>
                Fechar
              </button>
              <button type="submit" className="primary-btn" disabled={isSubmitting}>
                Criar
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {isCreateInvestmentOpen ? (
        <div className="modal-overlay">
          <form className="modal" onSubmit={handleCreateInvestment}>
            <h3>Novo investimento</h3>
            <p className="hint">
              O backend atual exige <code>walletId</code>. Para usuários recém-criados no frontend, ele é preenchido
              automaticamente.
            </p>
            <label>
              Wallet ID
              <input
                value={walletIdInput}
                onChange={(event) => setWalletIdInput(event.target.value)}
                required
                inputMode="numeric"
              />
            </label>
            <label>
              Valor inicial
              <input
                value={initialAmountInput}
                onChange={(event) => setInitialAmountInput(event.target.value)}
                required
                inputMode="decimal"
              />
            </label>
            <label>
              Data de investimento
              <input
                value={investedAtInput}
                type="date"
                onChange={(event) => setInvestedAtInput(event.target.value)}
                required
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="outline-btn" onClick={() => setIsCreateInvestmentOpen(false)}>
                Fechar
              </button>
              <button type="submit" className="primary-btn" disabled={isSubmitting}>
                Criar
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {isCreateWithdrawOpen ? (
        <div className="modal-overlay">
          <form className="modal" onSubmit={handleCreateWithdraw}>
            <h3>Novo saque</h3>
            <label>
              Investimento
              <select
                value={withdrawInvestmentIdInput}
                onChange={(event) => setWithdrawInvestmentIdInput(event.target.value)}
                required
              >
                {activeInvestments.map((investment) => (
                  <option key={investment.id} value={investment.id}>
                    ID {investment.id} - {formatMoney(investment.currentAmount)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Data do saque
              <input
                value={withdrawDateInput}
                type="date"
                onChange={(event) => setWithdrawDateInput(event.target.value)}
                required
              />
            </label>
            <label>
              Observações
              <textarea
                value={withdrawNotesInput}
                onChange={(event) => setWithdrawNotesInput(event.target.value)}
                rows={3}
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="outline-btn" onClick={() => setIsCreateWithdrawOpen(false)}>
                Fechar
              </button>
              <button type="submit" className="primary-btn" disabled={isSubmitting}>
                Confirmar saque
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
