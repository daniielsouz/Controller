import { useEffect, useState } from "react";
import MonthGrid from "../components/MonthGrid.jsx";
import MonthlySheet from "../components/MonthlySheet.jsx";
import TransactionForm from "../components/TransactionForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/logo.svg";

const CACHE_TTL_MS = 5 * 60 * 1000;

const buildCacheKey = (userId, scope) => `controller-cache:${userId}:${scope}`;

const readCache = (key) => {
  try {
    const rawValue = window.sessionStorage.getItem(key);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue.expiresAt || parsedValue.expiresAt < Date.now()) {
      window.sessionStorage.removeItem(key);
      return null;
    }

    return parsedValue.data;
  } catch (_error) {
    return null;
  }
};

const writeCache = (key, data) => {
  try {
    window.sessionStorage.setItem(
      key,
      JSON.stringify({
        data,
        expiresAt: Date.now() + CACHE_TTL_MS
      })
    );
  } catch (_error) {
    // Ignore cache write failures and keep the normal flow.
  }
};

const removeCache = (key) => {
  try {
    window.sessionStorage.removeItem(key);
  } catch (_error) {
    // Ignore cache cleanup failures.
  }
};

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const { user, logout, http, updateUser } = useAuth();
  const [year, setYear] = useState(currentYear);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [reportEmail, setReportEmail] = useState("");
  const [recipientEmails, setRecipientEmails] = useState([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [newRecipient, setNewRecipient] = useState({ label: "", email: "" });
  const [notes, setNotes] = useState("");
  const [municipality, setMunicipality] = useState("Chapeco");
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
  const [isLoadingMonth, setIsLoadingMonth] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileStatus, setProfileStatus] = useState({ type: "", text: "" });
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    confirmPassword: ""
  });
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [showProfileConfirm, setShowProfileConfirm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showReportCard, setShowReportCard] = useState(false);
  const [showMonthDataCard, setShowMonthDataCard] = useState(false);
  const isEditableMonth = selectedMonth?.isEditable ?? true;
  const userId = user?.id || "anonymous";

  const getYearCacheKey = (selectedYear) => buildCacheKey(userId, `year:${selectedYear}`);
  const getMonthCacheKey = (selectedYear, selectedMonthValue) =>
    buildCacheKey(userId, `month:${selectedYear}:${selectedMonthValue}`);
  const recipientCacheKey = buildCacheKey(userId, "recipient-emails");

  const resetProfileModalState = () => {
    setProfileStatus({ type: "", text: "" });
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      confirmPassword: ""
    });
    setShowProfilePassword(false);
    setShowProfileConfirm(false);
  };

  const hydrateYearState = (data) => {
    setMonths(data);
    setSelectedMonth((current) => {
      const preferredMonth = current?.month || new Date().getMonth() + 1;
      return data.find((item) => item.month === preferredMonth) || data[0];
    });
  };

  const invalidateMonthCaches = (selectedYear = year, selectedMonthValue = selectedMonth?.month) => {
    removeCache(getYearCacheKey(selectedYear));

    if (selectedMonthValue) {
      removeCache(getMonthCacheKey(selectedYear, selectedMonthValue));
    }
  };

  const loadYear = async (selectedYear = year) => {
    setIsLoadingMonth(true);
    try {
      const safeYear = Math.min(selectedYear, currentYear);
      const cacheKey = getYearCacheKey(safeYear);
      const cachedData = readCache(cacheKey);

      if (cachedData) {
        hydrateYearState(cachedData);
        return;
      }

      const { data } = await http.get(`/months?year=${safeYear}`);
      writeCache(cacheKey, data);
      hydrateYearState(data);
    } finally {
      setIsLoadingMonth(false);
    }
  };

  const loadMonth = async (selectedYear, selectedMonthValue) => {
    setIsLoadingMonth(true);
    try {
      const cacheKey = getMonthCacheKey(selectedYear, selectedMonthValue);
      const cachedData = readCache(cacheKey);

      if (cachedData) {
        setSelectedMonth(cachedData);
        setNotes(cachedData.notes || "");
        setMunicipality(cachedData.municipality || "Chapeco");
        return;
      }

      const { data } = await http.get(`/months/${selectedYear}/${selectedMonthValue}`);
      writeCache(cacheKey, data);
      setSelectedMonth(data);
      setNotes(data.notes || "");
      setMunicipality(data.municipality || "Chapeco");
    } finally {
      setIsLoadingMonth(false);
    }
  };

  const loadRecipientEmails = async () => {
    const cachedData = readCache(recipientCacheKey);

    if (cachedData) {
      setRecipientEmails(cachedData);
      return;
    }

    const { data } = await http.get("/recipient-emails");
    writeCache(recipientCacheKey, data);
    setRecipientEmails(data);
  };

  useEffect(() => {
    loadYear();
    loadRecipientEmails();
  }, [year]);

  useEffect(() => {
    if (selectedMonth) {
      setNotes(selectedMonth.notes || "");
      setMunicipality(selectedMonth.municipality || "Chapeco");
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedMonth && selectedMonth.isEditable === false) {
      setEditingTransaction(null);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (editingTransaction) {
      setShowForm(true);
    }
  }, [editingTransaction]);

  useEffect(() => {
    if (!statusMessage.text) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusMessage({ type: "", text: "" });
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [statusMessage]);

  const refreshMonthAndGrid = async (targetMonth = selectedMonth?.month) => {
    invalidateMonthCaches(year, targetMonth);
    await loadYear(year);
    await loadMonth(year, targetMonth);
  };

  const handleCreateOrUpdate = async (payload) => {
    if (!isEditableMonth) {
      return;
    }

    const isEditing = Boolean(editingTransaction);
    setIsSavingTransaction(true);
    setStatusMessage({
      type: "success",
      text: isEditing ? "Atualizando movimento..." : "Adicionando movimento..."
    });

    try {
      if (isEditing) {
        await http.put(`/transactions/${editingTransaction.id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setEditingTransaction(null);
        setStatusMessage({ type: "success", text: "Movimento atualizado com sucesso." });
      } else {
        await http.post("/transactions", payload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setStatusMessage({ type: "success", text: "Movimento adicionado com sucesso." });
      }

      await refreshMonthAndGrid(Number(payload.get("month")));
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || "Nao foi possivel salvar o movimento."
      });
      throw error;
    } finally {
      setIsSavingTransaction(false);
    }
  };

  const handleDelete = async (transactionId) => {
    if (!isEditableMonth) {
      return;
    }

    const confirmed = window.confirm("Tem certeza que deseja excluir este movimento?");

    if (!confirmed) {
      return;
    }

    setIsDeletingTransaction(true);
    setStatusMessage({ type: "success", text: "Excluindo movimento..." });

    try {
      await http.delete(`/transactions/${transactionId}`);
      await refreshMonthAndGrid(selectedMonth.month);
      setStatusMessage({ type: "success", text: "Movimento excluido com sucesso." });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || "Nao foi possivel excluir o movimento."
      });
    } finally {
      setIsDeletingTransaction(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!isEditableMonth) {
      return;
    }

    try {
      await http.put(`/months/${year}/${selectedMonth.month}`, {
        notes,
        municipality
      });
      setStatusMessage({ type: "success", text: "Dados do mes salvos." });
      await refreshMonthAndGrid(selectedMonth.month);
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || "Nao foi possivel salvar os dados do mes."
      });
    }
  };

  useEffect(() => {
    setProfileForm((current) => ({
      ...current,
      name: user?.name || "",
      email: user?.email || ""
    }));
  }, [user?.name, user?.email]);

  useEffect(() => {
    if (!isProfileModalOpen) {
      resetProfileModalState();
    }
  }, [isProfileModalOpen]);

  const handleProfileSave = async () => {
    const trimmedName = profileForm.name?.trim();
    const trimmedEmail = profileForm.email?.trim();

    if (!trimmedName || !trimmedEmail) {
      setProfileStatus({ type: "error", text: "Nome e e-mail sÃ£o obrigatÃ³rios." });
      return;
    }

    const newPassword = profileForm.password?.trim() || "";
    const confirmPassword = profileForm.confirmPassword?.trim() || "";
    const wantsPasswordChange = Boolean(newPassword || confirmPassword);

    if (wantsPasswordChange && (!newPassword || !confirmPassword)) {
      setProfileStatus({
        type: "error",
        text: "Para trocar a senha, preencha e confirme a nova senha."
      });
      return;
    }

    if (wantsPasswordChange && newPassword !== confirmPassword) {
      setProfileStatus({ type: "error", text: "As senhas precisam coincidir." });
      return;
    }

    setIsUpdatingProfile(true);
    setProfileStatus({ type: "success", text: "Atualizando perfil..." });

    try {
      const payload = { name: trimmedName, email: trimmedEmail };

      if (wantsPasswordChange) {
        payload.password = newPassword;
      }

      const { data } = await http.put("/auth/me", payload);
      updateUser(data.user);
      setProfileForm((current) => ({ ...current, password: "", confirmPassword: "" }));
      setProfileStatus({ type: "success", text: "Perfil atualizado com sucesso." });
    } catch (error) {
      setProfileStatus({
        type: "error",
        text: error.response?.data?.message || "Falha ao atualizar o perfil."
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSendReport = async () => {
    setIsSendingReport(true);
    setStatusMessage({ type: "success", text: "Enviando e-mail..." });

    try {
      const { data } = await http.post(`/months/${year}/${selectedMonth.month}/send-report`, {
        email: reportEmail
      });
      setStatusMessage({
        type: "success",
        text: data.message || "PDF enviado com sucesso."
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || "Falha ao enviar o PDF por e-mail."
      });
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleSaveRecipientEmail = async () => {
    try {
      const { data } = await http.post("/recipient-emails", newRecipient);
      const nextRecipients = [...recipientEmails, data].sort((a, b) =>
        a.label.localeCompare(b.label)
      );
      writeCache(recipientCacheKey, nextRecipients);
      setRecipientEmails(nextRecipients);
      setSelectedRecipientId(String(data.id));
      setReportEmail(data.email);
      setNewRecipient({ label: "", email: "" });
      setStatusMessage({ type: "success", text: "E-mail de destino salvo com sucesso." });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || "Nao foi possivel salvar o e-mail de destino."
      });
    }
  };

  const handleDeleteRecipientEmail = async () => {
    if (!selectedRecipientId) {
      return;
    }

    try {
      await http.delete(`/recipient-emails/${selectedRecipientId}`);
      const nextRecipients = recipientEmails.filter(
        (recipient) => String(recipient.id) !== selectedRecipientId
      );
      writeCache(recipientCacheKey, nextRecipients);
      setRecipientEmails(nextRecipients);
      setSelectedRecipientId("");
      setReportEmail("");
      setStatusMessage({ type: "success", text: "E-mail de destino removido com sucesso." });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || "Nao foi possivel remover o e-mail de destino."
      });
    }
  };

  return (
    <div className="dashboard">
      {statusMessage.text && (
        <div className={`status-banner ${statusMessage.type === "error" ? "error" : "success"}`}>
          {statusMessage.text}
        </div>
      )}

      <header className="topbar">
        <div className="topbar-brand">
          <img src={logo} alt="Grano" />
          <div>
          <p className="eyebrow">Grano</p>
          <h1>{user?.name || "Planilha mensal"}</h1>
          <p className="muted">Organize entradas, saídas e saldos por mês com visões claras de totais.</p>
          </div>
        </div>
        <div className="topbar-actions">
        <button className="ghost" type="button" onClick={() => setIsProfileModalOpen(true)}>
          Editar perfil
        </button>
          <input
            type="number"
            min="2000"
            max={currentYear}
            value={year}
            onChange={(event) => setYear(Math.min(Number(event.target.value || currentYear), currentYear))}
          />
          <button className="ghost" type="button" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <MonthGrid
        months={months}
        selectedMonth={selectedMonth}
        onSelect={(month) => loadMonth(month.year, month.month)}
      />

      {isLoadingMonth && (
        <div className="card">
          <p className="muted">Conectando ao banco de dados e buscando a planilha...</p>
        </div>
      )}

      {!isLoadingMonth && selectedMonth && (
        <section className="content-grid">
          <div className="sheet-column">
            <MonthlySheet
              month={selectedMonth}
              user={user}
              onEdit={setEditingTransaction}
              onDelete={handleDelete}
              canEdit={isEditableMonth}
            />
          </div>

          <div className="summary-column">
            <div className="card form-grid">
              <div className="card-header">
                <h3>Novo movimento</h3>
                <button
                  className="ghost mini-button"
                  type="button"
                  onClick={() => setShowForm((current) => !current)}
                  aria-label={showForm ? "Ocultar formulário" : "Mostrar formulário"}
                >
                  {showForm ? "˄" : "˅"}
                </button>
              </div>
              {showForm && (
                <TransactionForm
                  year={year}
                  month={selectedMonth.month}
                  editingTransaction={editingTransaction}
                  onCancel={() => setEditingTransaction(null)}
                  onSubmit={handleCreateOrUpdate}
                  disabled={!isEditableMonth || isSavingTransaction || isDeletingTransaction}
                  isSubmitting={isSavingTransaction}
                />
              )}
            </div>

            <div className="card form-grid">
              <div className="card-header">
                <h3>Enviar controle financeiro</h3>
                <button
                  className="ghost mini-button"
                  type="button"
                  onClick={() => setShowReportCard((current) => !current)}
                  aria-label={showReportCard ? "Ocultar envio" : "Mostrar envio"}
                >
                  {showReportCard ? "˄" : "˅"}
                </button>
              </div>
              {showReportCard && (
                <>
                  <label>
                    Destinos salvos
                    <select
                      value={selectedRecipientId}
                      onChange={(event) => {
                        const nextId = event.target.value;
                        setSelectedRecipientId(nextId);
                        const recipient = recipientEmails.find(
                          (item) => String(item.id) === nextId
                        );
                        setReportEmail(recipient?.email || "");
                      }}
                    >
                      <option value="">Selecione um destino salvo</option>
                      {recipientEmails.map((recipient) => (
                        <option key={recipient.id} value={recipient.id}>
                          {recipient.label} - {recipient.email}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    E-mail de destino
                    <input
                      type="email"
                      value={reportEmail}
                      onChange={(event) => setReportEmail(event.target.value)}
                    />
                  </label>
                  <div className="recipient-actions">
                    <button className="ghost" type="button" onClick={handleDeleteRecipientEmail}>
                      Remover selecionado
                    </button>
                  </div>
                  <div className="recipient-save-grid">
                    <label>
                      Nome do destino
                      <input
                        value={newRecipient.label}
                        onChange={(event) =>
                          setNewRecipient((current) => ({ ...current, label: event.target.value }))
                        }
                        placeholder="Ex: Financeiro empresa"
                      />
                    </label>
                    <label>
                      Novo e-mail para salvar
                      <input
                        type="email"
                        value={newRecipient.email}
                        onChange={(event) =>
                          setNewRecipient((current) => ({ ...current, email: event.target.value }))
                        }
                        placeholder="destino@empresa.com"
                      />
                    </label>
                    <button className="ghost" type="button" onClick={handleSaveRecipientEmail}>
                      Salvar destino
                    </button>
                  </div>
                  <button
                    className="primary"
                    type="button"
                    onClick={handleSendReport}
                    disabled={isSendingReport}
                  >
                    {isSendingReport ? "Enviando..." : "Enviar PDF do mes"}
                  </button>
                </>
              )}
            </div>

            <div className="card form-grid">
              <div className="card-header">
                <h3>Dados do mes</h3>
                <button
                  className="ghost mini-button"
                  type="button"
                  onClick={() => setShowMonthDataCard((current) => !current)}
                  aria-label={showMonthDataCard ? "Ocultar dados do mes" : "Mostrar dados do mes"}
                >
                  {showMonthDataCard ? "˄" : "˅"}
                </button>
              </div>
              {showMonthDataCard && (
                <>
                  <label>
                    Municipio
                    <input
                      value={municipality}
                      onChange={(event) => setMunicipality(event.target.value)}
                      placeholder="Digite o municipio"
                      disabled={!isEditableMonth}
                    />
                  </label>
                  <label>
                    Observacoes do mes
                    <textarea
                      rows="5"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      disabled={!isEditableMonth}
                    />
                  </label>
                  {!isEditableMonth && (
                    <p className="muted">
                      Este mes ainda esta bloqueado para edicao. Ele sera liberado quando o calendario chegar nele.
                    </p>
                  )}
                  <button className="ghost" type="button" onClick={handleSaveNotes} disabled={!isEditableMonth}>
                    Salvar dados do mes
                  </button>
                </>
              )}
            </div>

          </div>
        </section>
      )}
      {isProfileModalOpen && (
        <div className="profile-modal">
          <div className="profile-modal-card card">
            <div className="profile-modal-header">
              <h3>Editar perfil</h3>
              <button className="ghost mini-button" type="button" onClick={() => setIsProfileModalOpen(false)}>
                Fechar
              </button>
            </div>
          {profileStatus.text && (
            <p className={`inline-message ${profileStatus.type === "error" ? "error" : "success"}`}>
              {profileStatus.text}
            </p>
          )}
            <label>
              Nome
              <input
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, name: event.target.value }))
                }
                disabled={isUpdatingProfile}
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, email: event.target.value }))
                }
                disabled={isUpdatingProfile}
              />
            </label>
            <label>
              Nova senha
              <div className="password-field">
                <input
                  type={showProfilePassword ? "text" : "password"}
                  value={profileForm.password}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Deixe em branco para manter a atual"
                  disabled={isUpdatingProfile}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowProfilePassword((v) => !v)}
                  aria-label={showProfilePassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showProfilePassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-.722-3.25" />
                      <path d="M2 8a10.645 10.645 0 0 0 20 0" />
                      <path d="m20 15-1.726-2.05" />
                      <path d="m4 15 1.726-2.05" />
                      <path d="m9 18 .722-3.25" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
            <label>
              Confirme a senha
              <div className="password-field">
                <input
                  type={showProfileConfirm ? "text" : "password"}
                  value={profileForm.confirmPassword}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value
                    }))
                  }
                  placeholder="Repita a nova senha"
                  disabled={isUpdatingProfile}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowProfileConfirm((v) => !v)}
                  aria-label={showProfileConfirm ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showProfileConfirm ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-.722-3.25" />
                      <path d="M2 8a10.645 10.645 0 0 0 20 0" />
                      <path d="m20 15-1.726-2.05" />
                      <path d="m4 15 1.726-2.05" />
                      <path d="m9 18 .722-3.25" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
            <div className="form-actions">
              <button
                className="primary"
                type="button"
                disabled={isUpdatingProfile}
                onClick={handleProfileSave}
              >
                {isUpdatingProfile ? "Atualizando..." : "Salvar"}
              </button>
              <button
                className="ghost"
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setProfileStatus({ type: "", text: "" });
                  setProfileForm({
                    name: user?.name || "",
                    email: user?.email || "",
                    password: "",
                    confirmPassword: ""
                  });
                  setShowProfilePassword(false);
                  setShowProfileConfirm(false);
                }}
                disabled={isUpdatingProfile}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
