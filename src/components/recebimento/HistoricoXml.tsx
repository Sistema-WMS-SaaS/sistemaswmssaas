import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  Download,
  Archive,
  Ban,
  FileText,
  Clock,
  User,
  Activity,
  Tag,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { IconButton } from "./IconButton";
import {
  getXmlHistory,
  getXmlRecordById,
  archiveXmlRecord,
  cancelXmlRecord,
  updateXmlRecordInfo,
} from "@/lib/recebimento/functions";
import { eventBus } from "@/lib/event-bus";
import { useTenant } from "@/lib/tenant";
import type { XmlRecord, XmlRecordStatus, ProcessingLogEntry } from "@/lib/recebimento/types";
import { cn } from "@/lib/utils";

const statusLabel: Record<XmlRecordStatus, string> = {
  active: "Ativo",
  archived: "Arquivado",
  cancelled: "Cancelado",
};

const statusColor: Record<XmlRecordStatus, string> = {
  active: "text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400",
  archived: "text-muted-foreground bg-muted/50",
  cancelled: "text-destructive bg-destructive/10",
};

const statusOptions: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "active", label: "Ativo" },
  { value: "archived", label: "Arquivado" },
  { value: "cancelled", label: "Cancelado" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function prettyXml(xml: string): string {
  let formatted = "";
  let indent = 0;
  const lines = xml.replace(/>\s*</g, ">\n<").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("</")) {
      indent = Math.max(0, indent - 1);
    }
    formatted += "  ".repeat(indent) + trimmed + "\n";
    if (trimmed.startsWith("<") && !trimmed.startsWith("</") && !trimmed.endsWith("/>")) {
      indent++;
    }
  }
  return formatted;
}

function extractXmlData(xml: string): Record<string, string> {
  const data: Record<string, string> = {};
  const tagRegex = /<([a-zA-Z_:][a-zA-Z0-9_:.-]*)>([^<]+)<\/\1>/g;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(xml)) !== null) {
    data[match[1]] = match[2].trim();
  }
  return data;
}

function downloadXml(content: string, fileName: string) {
  const blob = new Blob([content], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

interface ViewDialogProps {
  record: XmlRecord;
  onClose: () => void;
}

function ViewXmlDialog({ record, onClose }: ViewDialogProps) {
  const [tab, setTab] = useState<"formatted" | "raw" | "extracted" | "audit">("formatted");
  const extracted = extractXmlData(record.xmlContent);

  const tabs = [
    { id: "formatted" as const, label: "XML Formatado", icon: FileText },
    { id: "raw" as const, label: "XML Original", icon: FileText },
    { id: "extracted" as const, label: "Dados Extraídos", icon: Tag },
    { id: "audit" as const, label: "Auditoria", icon: Activity },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-border/60 bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold">{record.fileName}</h3>
            <p className="text-xs text-muted-foreground">
              {formatDate(record.importDate)} · {statusLabel[record.status]} · {formatFileSize(record.fileSize)}
            </p>
          </div>
          <IconButton icon={X} label="Fechar" size="sm" onClick={onClose} />
        </div>

        <div className="flex gap-1 border-b border-border/60 px-6 pt-3">
          {tabs.map((t) => {
            const TIcon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-3 pb-2 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <TIcon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {tab === "formatted" && (
            <pre className="overflow-auto rounded-lg bg-muted/40 p-4 font-mono text-xs leading-relaxed">
              {prettyXml(record.xmlContent)}
            </pre>
          )}
          {tab === "raw" && (
            <textarea
              readOnly
              value={record.xmlContent}
              className="h-64 w-full resize-none rounded-lg border border-input bg-muted/40 p-4 font-mono text-xs leading-relaxed focus-visible:outline-none"
            />
          )}
          {tab === "extracted" && (
            <div className="space-y-2">
              {Object.entries(extracted).length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(extracted).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-border/60 bg-card px-3 py-2"
                    >
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {key}
                      </span>
                      <p className="mt-0.5 text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum dado textual extraído do XML.
                </p>
              )}
            </div>
          )}
          {tab === "audit" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Usuário</span>
                  <p className="font-medium">{record.userName}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Data da Importação</span>
                  <p className="font-medium">{formatDate(record.importDate)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Tipo do XML</span>
                  <p className="font-medium">{record.xmlType}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Última Atualização</span>
                  <p className="font-medium">{formatDate(record.lastUpdate)}</p>
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                  Histórico de Processamento
                </h4>
                <div className="space-y-2">
                  {record.processingLog.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border/60 bg-card px-3 py-2"
                    >
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium capitalize">{entry.action}</span>
                          <span className="text-muted-foreground">
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{entry.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface UpdateInfoDialogProps {
  record: XmlRecord;
  onClose: () => void;
  onUpdated: () => void;
}

function UpdateInfoDialog({ record, onClose, onUpdated }: UpdateInfoDialogProps) {
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateXmlRecordInfo({ data: { id: record.id, observations } });
    setSaving(false);
    onUpdated();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        className="flex w-full max-w-lg flex-col rounded-2xl border border-border/60 bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h3 className="text-base font-semibold">Atualizar Informações</h3>
          <IconButton icon={X} label="Fechar" size="sm" onClick={onClose} />
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Arquivo
            </label>
            <p className="text-sm font-medium">{record.fileName}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <span
              className={cn(
                "ml-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                statusColor[record.status],
              )}
            >
              {statusLabel[record.status]}
            </span>
          </div>
          <div>
            <label htmlFor="update-observations" className="text-xs font-medium text-muted-foreground">
              Observações
            </label>
            <textarea
              id="update-observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Adicionar observações sobre este registro..."
              rows={3}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border/60 px-6 py-4">
          <IconButton icon={X} label="Cancelar" size="sm" onClick={onClose} />
          <IconButton
            icon={Pencil}
            label="Salvar"
            description="Salvar alterações"
            size="sm"
            disabled={saving}
            onClick={handleSave}
          />
        </div>
      </div>
    </div>
  );
}

export function HistoricoXml() {
  const [records, setRecords] = useState<XmlRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<XmlRecord | null>(null);
  const [updateRecord, setUpdateRecord] = useState<XmlRecord | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filterFileName, setFilterFileName] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterUserId, setFilterUserId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { tenant } = useTenant();

  const buildFilter = useCallback(() => {
    const f: Record<string, string | number> = { tenantId: tenant.id, page, pageSize };
    const q = searchQuery || filterFileName;
    if (q) f.fileName = q;
    if (filterStartDate) f.startDate = filterStartDate;
    if (filterEndDate) f.endDate = filterEndDate;
    if (filterUserId) f.userId = filterUserId;
    if (filterStatus) f.status = filterStatus;
    return f;
  }, [tenant.id, page, pageSize, searchQuery, filterFileName, filterStartDate, filterEndDate, filterUserId, filterStatus]);

  const load = useCallback(async () => {
    setLoading(true);
    const filter = buildFilter();
    const result = await getXmlHistory({ data: filter as any });
    setRecords(result.records);
    setTotalRecords(result.total);
    setLoading(false);
  }, [buildFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = eventBus.subscribe((ev) => {
      if (ev.type === "xml.imported" || ev.type === "xml.updated") load();
    });
    return () => { unsub(); };
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const clearFilters = () => {
    setFilterFileName("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterUserId("");
    setFilterStatus("");
    setSearchQuery("");
    setPage(1);
  };

  const handleView = async (id: string) => {
    const result = await getXmlRecordById({ data: { id } });
    if (result.record) setSelectedRecord(result.record);
  };

  const handleDownload = (r: XmlRecord) => {
    downloadXml(r.xmlContent, r.fileName);
  };

  const handleArchive = async (id: string) => {
    await archiveXmlRecord({ data: { id } });
    load();
    eventBus.publish({ type: "xml.updated", recordId: id, status: "archived", tenantId: tenant.id, userId: "system" });
  };

  const handleCancel = async (id: string) => {
    await cancelXmlRecord({ data: { id } });
    load();
    eventBus.publish({ type: "xml.updated", recordId: id, status: "cancelled", tenantId: tenant.id, userId: "system" });
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <section aria-labelledby="historico-xml-title">
      <div className="flex items-center justify-between">
        <h2 id="historico-xml-title" className="text-lg font-semibold">
          Histórico XML
        </h2>
        <IconButton
          icon={Filter}
          label="Filtros"
          description="Abrir painel de filtros avançados"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        />
      </div>

      <form onSubmit={handleSearch} className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Pesquisar por nome do arquivo..."
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <IconButton icon={Search} label="Pesquisar" shortcut="Enter" size="md" type="submit" />
      </form>

      {showFilters && (
        <form onSubmit={handleFilterSubmit} className="mt-3 rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Filtros Avançados</span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar filtros
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome do Arquivo</label>
              <input
                type="text"
                value={filterFileName}
                onChange={(e) => setFilterFileName(e.target.value)}
                placeholder="Filtrar por nome..."
                className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Data Inicial</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Data Final</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Usuário</label>
              <input
                type="text"
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                placeholder="ID do usuário..."
                className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <IconButton icon={Search} label="Aplicar Filtros" size="sm" type="submit" />
          </div>
        </form>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhum XML importado ainda.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Utilize a funcionalidade "Importar XML" para adicionar registros.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Nome do Arquivo
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                    Data
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                    Usuário
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                    Tamanho
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/20"
                  >
                    <td className="max-w-48 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate font-medium">{r.fileName}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {formatDate(r.importDate)}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {r.userName}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {formatFileSize(r.fileSize)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                          statusColor[r.status],
                        )}
                      >
                        {statusLabel[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon={Eye}
                          label="Visualizar"
                          description="Ver XML completo e dados extraídos"
                          size="sm"
                          onClick={() => handleView(r.id)}
                        />
                        <IconButton
                          icon={Download}
                          label="Download XML"
                          description="Baixar o arquivo XML original"
                          size="sm"
                          onClick={() => handleDownload(r)}
                        />
                        <IconButton
                          icon={Pencil}
                          label="Atualizar"
                          description="Atualizar informações do registro"
                          size="sm"
                          onClick={() => setUpdateRecord(r)}
                        />
                        {r.status === "active" && (
                          <>
                            <IconButton
                              icon={Archive}
                              label="Arquivar"
                              description="Mover para arquivo"
                              size="sm"
                              onClick={() => handleArchive(r.id)}
                            />
                            <IconButton
                              icon={Ban}
                              label="Cancelar"
                              description="Cancelar registro"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancel(r.id)}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {totalRecords} registro{totalRecords !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Atualizado em tempo real
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <IconButton
              icon={ChevronLeft}
              label="Anterior"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            />
            <span className="px-2 text-xs tabular-nums">
              {page} / {totalPages}
            </span>
            <IconButton
              icon={ChevronRight}
              label="Próxima"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </div>
        )}
      </div>

      {selectedRecord && (
        <ViewXmlDialog
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {updateRecord && (
        <UpdateInfoDialog
          record={updateRecord}
          onClose={() => setUpdateRecord(null)}
          onUpdated={load}
        />
      )}
    </section>
  );
}
