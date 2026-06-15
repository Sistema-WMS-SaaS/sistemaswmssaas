import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { IconButton } from "./IconButton";
import { importXml } from "@/lib/recebimento/functions";
import { eventBus } from "@/lib/event-bus";
import { useTenant } from "@/lib/tenant";
import type { XmlImportStatus } from "@/lib/recebimento/types";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  XmlImportStatus,
  { label: string; color: string; icon: typeof AlertCircle }
> = {
  pending: { label: "Pendente", color: "text-muted-foreground", icon: AlertCircle },
  processing: { label: "Processando", color: "text-blue-500", icon: AlertCircle },
  success: { label: "Importado com Sucesso", color: "text-green-600", icon: CheckCircle2 },
  error: { label: "Importado com Erro", color: "text-destructive", icon: AlertCircle },
  invalid: { label: "Arquivo Inválido", color: "text-destructive", icon: AlertCircle },
};

export function ImportarXml() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<XmlImportStatus | null>(null);
  const [observations, setObservations] = useState("");
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tenant } = useTenant();

  const reset = () => {
    setFile(null);
    setStatus(null);
    setObservations("");
    setErrorMsg("");
    setImporting(false);
  };

  const validateFile = (f: File): string | null => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!f.name || !ext) return "Arquivo sem nome válido.";
    if (ext !== "xml") return "Apenas arquivos com extensão .xml são permitidos.";
    if (f.size <= 0) return "Arquivo vazio.";
    if (f.size > 10 * 1024 * 1024) return "Arquivo excede o limite de 10 MB.";
    return null;
  };

  const handleFile = (f: File) => {
    const err = validateFile(f);
    if (err) {
      setErrorMsg(err);
      setStatus("invalid");
      setFile(f);
      return;
    }
    setErrorMsg("");
    setStatus("pending");
    setFile(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const onFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setStatus("processing");

    try {
      const content = await file.text();
      const result = await importXml({ data: { fileName: file.name, content, fileSize: file.size, observations } });

      if (result.success) {
        setStatus("success");
        eventBus.publish({
          type: "xml.imported",
          fileName: file.name,
          recordId: result.recordId!,
          tenantId: tenant.id,
          userId: "system",
        });
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? "Erro desconhecido.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Erro ao processar o arquivo. Tente novamente.");
    } finally {
      setImporting(false);
    }
  };

  const StatusIcon = status ? statusConfig[status].icon : null;

  return (
    <section aria-labelledby="importar-xml-title">
      <div className="flex items-center justify-between">
        <h2 id="importar-xml-title" className="text-lg font-semibold">
          Importar XML
        </h2>
        {file && (
          <IconButton
            icon={X}
            label="Limpar"
            description="Remover arquivo selecionado"
            size="sm"
            onClick={reset}
          />
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "mt-4 cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragOver
            ? "border-primary/50 bg-primary/5"
            : "border-border/60 hover:border-primary/30 hover:bg-muted/30",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          onChange={onFileSelect}
          className="hidden"
          aria-hidden="true"
        />

        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Arraste o arquivo XML aqui ou clique para selecionar
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Apenas arquivos .xml até 10 MB
        </p>
      </div>

      {file && (
        <div className="mt-6 space-y-4 rounded-xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {StatusIcon && status && (
              <div className={cn("flex items-center gap-1.5 text-xs font-medium", statusConfig[status].color)}>
                <StatusIcon className="h-4 w-4" />
                <span>{statusConfig[status].label}</span>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Nome do Arquivo
              </label>
              <p className="text-sm">{file.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Data da Importação
              </label>
              <p className="text-sm">
                {status === "success"
                  ? new Date().toLocaleString("pt-BR")
                  : "—"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Usuário
              </label>
              <p className="text-sm">Usuário Demo</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <p className={cn("text-sm font-medium", status ? statusConfig[status].color : "")}>
                {status ? statusConfig[status].label : "Pendente"}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="observations" className="text-xs font-medium text-muted-foreground">
              Observações
            </label>
            <textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações opcionais sobre esta importação..."
              disabled={status === "success" || importing}
              rows={2}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {status !== "success" && (
            <div className="flex justify-end">
              <IconButton
                icon={Upload}
                label="Importar XML"
                description="Validar e registrar o arquivo no sistema"
                shortcut="Enter"
                size="md"
                variant={status === "invalid" ? "destructive" : "default"}
                disabled={!file || importing || status === "invalid"}
                onClick={handleImport}
              />
            </div>
          )}

          {status === "success" && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              Arquivo importado com sucesso e registrado no Histórico XML.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
