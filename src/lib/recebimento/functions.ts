import { createServerFn } from "@tanstack/react-start";
import { importXmlSchema, xmlHistoryFilterSchema, xmlRecordIdSchema, updateXmlRecordSchema } from "./schemas";
import {
  addImportRecord,
  addXmlRecord,
  getAllXmlRecords,
  getXmlRecord,
  searchXmlRecords,
  updateXmlRecordStatus,
  updateXmlRecord,
} from "./store.server";
import type { XmlRecord, XmlImportRecord, XmlRecordStatus } from "./types";

function generateId(): string {
  return `xml-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

function validateXmlContent(content: string): { valid: boolean; error?: string } {
  const trimmed = content.trim()
  if (!trimmed.startsWith("<")) {
    return { valid: false, error: "XML deve começar com uma tag de abertura." }
  }
  if (!trimmed.endsWith(">")) {
    return { valid: false, error: "XML deve terminar com uma tag de fechamento." }
  }
  const openTagMatch = trimmed.match(/^<([a-zA-Z_:][a-zA-Z0-9_:.-]*)/)
  if (!openTagMatch) {
    return { valid: false, error: "Tag raiz inválida." }
  }
  const rootName = openTagMatch[1]
  const closeTag = new RegExp(`</${rootName}>\\s*$`)
  if (!closeTag.test(trimmed)) {
    return { valid: false, error: `Tag de fechamento </${rootName}> não encontrada ao final do XML.` }
  }
  return { valid: true }
}

function detectXmlType(content: string): string {
  const match = content.match(/<([a-zA-Z_:][a-zA-Z0-9_:.-]*)/)
  return match ? match[1] : "unknown"
}

export const importXml = createServerFn({ method: "POST" })
  .validator(importXmlSchema)
  .handler(async ({ data }) => {
    const validation = validateXmlContent(data.content)
    if (!validation.valid) {
      return {
        success: false as const,
        error: validation.error ?? "Estrutura do XML inválida.",
      }
    }

    const id = generateId()
    const now = formatTimestamp()
    const xmlType = detectXmlType(data.content)

    const importRecord: XmlImportRecord = {
      id,
      tenantId: "demo",
      fileName: data.fileName,
      importDate: now,
      userId: "system",
      userName: "Usuário Demo",
      status: "success",
      observations: data.observations ?? "",
    }

    const xmlRecord: XmlRecord = {
      id,
      tenantId: "demo",
      fileName: data.fileName,
      fileSize: data.fileSize ?? 0,
      xmlType,
      xmlContent: data.content,
      importDate: now,
      userId: "system",
      userName: "Usuário Demo",
      status: "active",
      lastUpdate: now,
      processingLog: [
        { timestamp: now, action: "importado", details: "XML importado com sucesso." },
        { timestamp: now, action: "validado", details: `Tipo detectado: ${xmlType}` },
      ],
    }

    addImportRecord(importRecord)
    addXmlRecord(xmlRecord)

    return { success: true as const, recordId: id }
  })

export const getXmlHistory = createServerFn({ method: "POST" })
  .validator(xmlHistoryFilterSchema)
  .handler(async ({ data }) => {
    const result = searchXmlRecords(data)
    const total = result.records.length
    return { records: result.records, total: result.total }
  })

export const getXmlRecordById = createServerFn({ method: "POST" })
  .validator(xmlRecordIdSchema)
  .handler(async ({ data }) => {
    const record = getXmlRecord(data.id)
    if (!record) {
      return { record: null, error: "Registro não encontrado." }
    }
    return { record, error: null }
  })

export const archiveXmlRecord = createServerFn({ method: "POST" })
  .validator(xmlRecordIdSchema)
  .handler(async ({ data }) => {
    const now = formatTimestamp()
    const updated = updateXmlRecordStatus(data.id, "archived", {
      timestamp: now,
      action: "arquivado",
      details: "Registro arquivado pelo usuário.",
    })
    if (!updated) {
      return { success: false as const, error: "Registro não encontrado." }
    }
    return { success: true as const }
  })

export const cancelXmlRecord = createServerFn({ method: "POST" })
  .validator(xmlRecordIdSchema)
  .handler(async ({ data }) => {
    const now = formatTimestamp()
    const updated = updateXmlRecordStatus(data.id, "cancelled", {
      timestamp: now,
      action: "cancelado",
      details: "Registro cancelado pelo usuário.",
    })
    if (!updated) {
      return { success: false as const, error: "Registro não encontrado." }
    }
    return { success: true as const }
  })

export const updateXmlRecordInfo = createServerFn({ method: "POST" })
  .validator(updateXmlRecordSchema)
  .handler(async ({ data }) => {
    const record = getXmlRecord(data.id)
    if (!record) {
      return { success: false as const, error: "Registro não encontrado." }
    }
    const now = formatTimestamp()
    if (data.observations !== undefined) {
      record.processingLog.push({
        timestamp: now,
        action: "atualizado",
        details: `Observações atualizadas: "${data.observations}"`,
      })
    }
    record.lastUpdate = now
    return { success: true as const }
  })
