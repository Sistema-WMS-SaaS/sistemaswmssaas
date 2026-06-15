export type XmlImportStatus = "pending" | "processing" | "success" | "error" | "invalid"

export type XmlRecordStatus = "active" | "archived" | "cancelled"

export interface XmlImportRecord {
  id: string
  tenantId: string
  fileName: string
  importDate: string
  userId: string
  userName: string
  status: XmlImportStatus
  observations?: string
}

export interface XmlRecord {
  id: string
  tenantId: string
  fileName: string
  fileSize: number
  xmlType: string
  xmlContent: string
  importDate: string
  userId: string
  userName: string
  status: XmlRecordStatus
  lastUpdate: string
  processingLog: ProcessingLogEntry[]
}

export interface ProcessingLogEntry {
  timestamp: string
  action: string
  details: string
}

export interface XmlHistoryFilter {
  fileName?: string
  productCode?: string
  startDate?: string
  endDate?: string
  userId?: string
  status?: XmlRecordStatus
  tenantId?: string
}

export type RecebimentoFeature = "importar-xml" | "historico-xml"
