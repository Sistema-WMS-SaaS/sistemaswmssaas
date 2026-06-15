import type { XmlRecord, XmlImportRecord, ProcessingLogEntry } from "./types"

const xmlRecords = new Map<string, XmlRecord>()
const xmlImports = new Map<string, XmlImportRecord>()

export function addImportRecord(record: XmlImportRecord): void {
  xmlImports.set(record.id, record)
}

export function getImportRecord(id: string): XmlImportRecord | undefined {
  return xmlImports.get(id)
}

export function addXmlRecord(record: XmlRecord): void {
  xmlRecords.set(record.id, record)
}

export function getXmlRecord(id: string): XmlRecord | undefined {
  return xmlRecords.get(id)
}

export function getAllXmlRecords(): XmlRecord[] {
  return Array.from(xmlRecords.values())
}

export function getAllImportRecords(): XmlImportRecord[] {
  return Array.from(xmlImports.values())
}

export function updateXmlRecordStatus(
  id: string,
  status: "active" | "archived" | "cancelled",
  logEntry: ProcessingLogEntry,
): XmlRecord | undefined {
  const record = xmlRecords.get(id)
  if (!record) return undefined
  record.status = status
  record.lastUpdate = new Date().toISOString()
  record.processingLog.push(logEntry)
  return record
}

export function updateXmlRecord(id: string, updates: Partial<XmlRecord>): XmlRecord | undefined {
  const record = xmlRecords.get(id)
  if (!record) return undefined
  Object.assign(record, updates)
  return record
}

export function searchXmlRecords(filter: {
  fileName?: string
  productCode?: string
  startDate?: string
  endDate?: string
  userId?: string
  status?: string
  tenantId?: string
  page?: number
  pageSize?: number
}): { records: XmlRecord[]; total: number } {
  let results = Array.from(xmlRecords.values())

  if (filter.tenantId) {
    results = results.filter((r) => r.tenantId === filter.tenantId)
  }
  if (filter.fileName) {
    const q = filter.fileName.toLowerCase()
    results = results.filter((r) => r.fileName.toLowerCase().includes(q))
  }
  if (filter.userId) {
    results = results.filter((r) => r.userId === filter.userId)
  }
  if (filter.status) {
    results = results.filter((r) => r.status === filter.status)
  }
  if (filter.startDate) {
    const start = new Date(filter.startDate).getTime()
    results = results.filter((r) => new Date(r.importDate).getTime() >= start)
  }
  if (filter.endDate) {
    const end = new Date(filter.endDate).getTime()
    results = results.filter((r) => new Date(r.importDate).getTime() <= end)
  }

  results.sort((a, b) => new Date(b.importDate).getTime() - new Date(a.importDate).getTime())

  const total = results.length
  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 20
  const start = (page - 1) * pageSize
  const paged = results.slice(start, start + pageSize)

  return { records: paged, total }
}
