import { useEffect, useState } from "react";
import MonthGrid from "../components/MonthGrid.jsx";
import MonthlySheet from "../components/MonthlySheet.jsx";
import TransactionForm from "../components/TransactionForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const { user, logout, http } = useAuth();
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
  const isEditableMonth = selectedMonth?.isEditable ?? true;

  const loadYear = async (selectedYear = year) => {
    const safeYear = Math.min(selectedYear, currentYear);
    const { data } = await http.get(`/months?year=${safeYear}`);
    setMonths(data);
    setSelectedMonth((current) => {
      const preferredMonth = current?.month || new Date().getMonth() + 1;
      return data.find((item) => item.month === preferredMonth) || data[0];
    });
  };

  const loadMonth = async (selectedYear, selectedMonthValue) => {
    const { data } = await http.get(`/months/${selectedYear}/${selectedMonthValue}`);
    setSelectedMonth(data);
    setNotes(data.notes || "");
    setMunicipality(data.municipality || "Chapeco");
  };

  const loadRecipientEmails = async () => {
    const { data } = await http.get("/recipient-emails");
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
    if (!statusMessage.text) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusMessage({ type: "", text: "" });
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [statusMessage]);

  const refreshMonthAndGrid = async (targetMonth = selectedMonth?.month) => {
    await loadYear(year);
    await loadMonth(year, targetMonth);
  };

  const handleCreateOrUpdate = async (payload) => {
    if (!isEditableMonth) {
      return;
    }

    try {
      if (editingTransaction) {
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
    }
  };

  const handleDelete = async (transactionId) => {
    if (!isEditableMonth) {
      return;
    }

    await http.delete(`/transactions/${transactionId}`);
    await refreshMonthAndGrid(selectedMonth.month);
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
      setRecipientEmails((current) =>
        current.filter((recipient) => String(recipient.id) !== selectedRecipientId)
      );
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
      <header className="topbar">
        <div>
          <p className="eyebrow">Controle Financeiro</p>
          <h1>Planilha mensal</h1>
          <p className="muted">Visual de planilha com abas mensais e totais do periodo.</p>
        </div>
        <div className="topbar-actions">
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

      {selectedMonth && (
        <section className="content-grid">
          <div className="sheet-column">
            <MonthlySheet
              month={selectedMonth}
              user={user}
              onEdit={setEditingTransaction}
              onDelete={handleDelete}
              canEdit={isEditableMonth}
            />
            {statusMessage.text && (
              <p className={`${statusMessage.type === "error" ? "error" : "success"} inline-message`}>
                {statusMessage.text}
              </p>
            )}
          </div>

          <div className="summary-column">
            <TransactionForm
              year={year}
              month={selectedMonth.month}
              editingTransaction={editingTransaction}
              onCancel={() => setEditingTransaction(null)}
              onSubmit={handleCreateOrUpdate}
              disabled={!isEditableMonth}
            />

            <div className="card form-grid">
              <h3>Enviar controle financeiro</h3>
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
            </div>

            <div className="card form-grid">
              <h3>Dados do mes</h3>
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
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
