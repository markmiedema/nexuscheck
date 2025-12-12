/**
 * Comprehensive Excel Export for Nexus Analysis
 * Creates a professional 5-sheet workbook for executives and tax professionals
 *
 * Uses detailed state data from the state detail API endpoint for accurate
 * transaction-level data, tax rates, and liability breakdowns.
 */

import ExcelJS from 'exceljs'
import { StateResult } from '@/types/states'
import { YearData, StateDetailResponse, ComplianceInfo } from '@/lib/api'
import { Analysis } from '@/lib/api/analyses'

// Color constants matching the spec
const COLORS = {
  DARK_BLUE: 'FF1F4E79',
  LIGHT_GRAY: 'FFD6DCE5',
  GREEN_FILL: 'FFC6EFCE',
  RED_FILL: 'FFF2DCDB',
  YELLOW_FILL: 'FFFFF2CC',
  ALT_ROW: 'FFF5F5F5',
  WHITE: 'FFFFFFFF',
  RED_TEXT: 'FFC00000',
  GRAY_TEXT: 'FF666666',
}

export interface ExportData {
  analysis: Analysis
  states: StateResult[]
  stateDetails: Map<string, StateDetailResponse>
}

interface TransactionRow {
  state: string
  stateCode: string
  date: string
  transNum: number
  grossSales: number
  taxable: number
  exempt: number
  channel: string
  ytdGrossSales: number
  ytdTrans: number
  exemptionReason: string
  crossedThreshold: boolean
}

/**
 * Generate a comprehensive 5-sheet Excel export
 */
export async function generateNexusExcelExport(data: ExportData): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'NexusCheck'
  workbook.created = new Date()

  // Include all states with sales (not just nexus states)
  const statesWithSales = data.states.filter(s => s.total_sales > 0)

  // Sort by total liability descending (using detail data when available)
  statesWithSales.sort((a, b) => {
    const detailA = data.stateDetails.get(a.state_code)
    const detailB = data.stateDetails.get(b.state_code)
    const liabA = detailA ? (detailA.base_tax + detailA.interest + detailA.penalties) : getTotalLiability(a)
    const liabB = detailB ? (detailB.base_tax + detailB.interest + detailB.penalties) : getTotalLiability(b)
    return liabB - liabA
  })

  // Create sheets in order
  createDashboardSheet(workbook, data, statesWithSales)
  createStateSummarySheet(workbook, data, statesWithSales)
  createYearByYearSheet(workbook, data, statesWithSales)
  createTransactionsSheet(workbook, data, statesWithSales)
  createDocumentationSheet(workbook, data, statesWithSales)

  // Generate buffer and return as Blob
  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}

/**
 * Helper to get total liability from a state (fallback when detail not available)
 */
function getTotalLiability(state: StateResult): number {
  const baseTax = state.base_tax ?? state.estimated_liability
  const interest = state.interest ?? 0
  const penalties = state.penalties ?? 0
  return baseTax + interest + penalties
}

/**
 * Helper to format state name with abbreviation
 */
function formatStateName(stateCode: string, stateName: string): string {
  return `${stateName} (${stateCode})`
}

/**
 * Helper to get nexus status label
 */
function getNexusStatusLabel(nexusType: string): string {
  if (nexusType === 'both') return 'Physical + Economic'
  if (nexusType === 'physical') return 'Physical Nexus'
  if (nexusType === 'economic') return 'Economic Nexus'
  return 'No Nexus'
}

/**
 * Helper to format date as Month DD, YYYY
 */
function formatDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
}

/**
 * Helper to format date as Month Year
 */
function formatMonthYear(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Helper to apply section header styling
 */
function applySectionHeader(row: ExcelJS.Row, text: string, colSpan: number = 7): void {
  const cell = row.getCell(2)
  cell.value = text
  cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.DARK_BLUE }
  }
  // Merge cells for section header
  const worksheet = row.worksheet
  worksheet.mergeCells(row.number, 2, row.number, colSpan)
}

/**
 * Helper to apply table header styling
 */
function applyTableHeaderStyle(row: ExcelJS.Row): void {
  row.font = { bold: true, size: 10 }
  row.alignment = { horizontal: 'center', vertical: 'middle' }
  row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
    if (colNumber >= 2) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.LIGHT_GRAY }
      }
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    }
  })
}

/**
 * Helper to apply data cell borders
 */
function applyDataCellBorders(row: ExcelJS.Row, startCol: number = 2): void {
  row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
    if (colNumber >= startCol) {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    }
  })
}

/**
 * Get trigger date for a state from detailed data
 */
function getTriggerDate(detail: StateDetailResponse | undefined, state: StateResult): string {
  if (detail && detail.year_data && detail.year_data.length > 0) {
    for (const yd of detail.year_data) {
      if (yd.nexus_date) return yd.nexus_date
      if (yd.obligation_start_date) return yd.obligation_start_date
    }
  }
  // Fallback to state's year_data
  if (state.year_data && state.year_data.length > 0) {
    for (const yd of state.year_data) {
      if (yd.nexus_date) return yd.nexus_date
      if (yd.obligation_start_date) return yd.obligation_start_date
    }
  }
  return ''
}

/**
 * Sheet 1: Dashboard - Executive summary with KPIs and ranked liability table
 */
function createDashboardSheet(
  workbook: ExcelJS.Workbook,
  data: ExportData,
  nexusStates: StateResult[]
): void {
  const ws = workbook.addWorksheet('Dashboard')

  // Set column widths
  ws.columns = [
    { width: 3 },  // A - margin
    { width: 20 }, // B
    { width: 18 }, // C
    { width: 18 }, // D
    { width: 18 }, // E
    { width: 18 }, // F
    { width: 18 }, // G
    { width: 18 }, // H
    { width: 18 }, // I
    { width: 12 }, // J
    { width: 12 }, // K
  ]

  // Row 2: Report title
  const titleRow = ws.getRow(2)
  ws.mergeCells('B2:I2')
  const titleCell = titleRow.getCell(2)
  titleCell.value = 'State Nexus Analysis Report'
  titleCell.font = { bold: true, size: 16, color: { argb: COLORS.DARK_BLUE } }
  titleCell.alignment = { horizontal: 'center' }

  // Row 3: Company name and generation date
  const subtitleRow = ws.getRow(3)
  ws.mergeCells('B3:I3')
  const subtitleCell = subtitleRow.getCell(2)
  const generatedDate = formatDateLong(new Date().toISOString())
  subtitleCell.value = `${data.analysis.client_company_name} — Generated ${generatedDate}`
  subtitleCell.font = { italic: true, color: { argb: COLORS.GRAY_TEXT } }
  subtitleCell.alignment = { horizontal: 'center' }

  // Row 4: Analysis period
  const periodRow = ws.getRow(4)
  ws.mergeCells('B4:I4')
  const periodCell = periodRow.getCell(2)
  const startDate = formatMonthYear(data.analysis.analysis_period_start)
  const endDate = formatMonthYear(data.analysis.analysis_period_end)
  periodCell.value = `Analysis Period: ${startDate} – ${endDate}`
  periodCell.font = { italic: true, color: { argb: COLORS.GRAY_TEXT } }
  periodCell.alignment = { horizontal: 'left' }

  // Row 6: NEXUS SUMMARY header
  applySectionHeader(ws.getRow(6), 'NEXUS SUMMARY', 9)

  // Calculate nexus counts using detail data
  let physicalPlusEconomic = 0
  let physicalOnly = 0
  let economicOnly = 0

  for (const state of nexusStates) {
    const detail = data.stateDetails.get(state.state_code)
    const nexusType = detail?.nexus_type || state.nexus_type
    if (nexusType === 'both') physicalPlusEconomic++
    else if (nexusType === 'physical') physicalOnly++
    else if (nexusType === 'economic') economicOnly++
  }

  const totalWithNexus = nexusStates.length

  // Row 8: Nexus counts
  const nexusRow = ws.getRow(8)
  nexusRow.getCell(2).value = 'Physical + Economic:'
  nexusRow.getCell(3).value = physicalPlusEconomic
  nexusRow.getCell(4).value = 'Physical Only:'
  nexusRow.getCell(5).value = physicalOnly
  nexusRow.getCell(6).value = 'Economic Only:'
  nexusRow.getCell(7).value = economicOnly
  nexusRow.getCell(8).value = 'Total with Nexus:'
  const totalCell = nexusRow.getCell(9)
  totalCell.value = totalWithNexus
  totalCell.font = { bold: true, color: { argb: COLORS.RED_TEXT } }

  // Row 10: FINANCIAL SUMMARY header
  applySectionHeader(ws.getRow(10), 'FINANCIAL SUMMARY', 9)

  // Calculate financial totals using detailed state data
  let totalGrossSales = 0
  let totalTaxableSales = 0
  let totalExposureSales = 0
  let totalDirectSales = 0
  let totalMarketplaceSales = 0

  for (const state of nexusStates) {
    const detail = data.stateDetails.get(state.state_code)
    if (detail) {
      totalGrossSales += detail.total_sales
      totalTaxableSales += detail.taxable_sales
      totalExposureSales += detail.exposure_sales
      totalDirectSales += detail.direct_sales
      totalMarketplaceSales += detail.marketplace_sales
    } else {
      totalGrossSales += state.total_sales
      totalTaxableSales += state.taxable_sales || 0
      totalExposureSales += state.exposure_sales || 0
      totalDirectSales += state.direct_sales || 0
      totalMarketplaceSales += state.marketplace_sales || 0
    }
  }

  // Row 12: Sales line 1
  const salesRow1 = ws.getRow(12)
  salesRow1.getCell(2).value = 'Total Gross Sales:'
  salesRow1.getCell(3).value = totalGrossSales
  salesRow1.getCell(3).numFmt = '$#,##0'
  salesRow1.getCell(4).value = 'Total Taxable Sales:'
  salesRow1.getCell(5).value = totalTaxableSales
  salesRow1.getCell(5).numFmt = '$#,##0'
  salesRow1.getCell(6).value = 'Total Exposure Sales'
  salesRow1.getCell(7).value = totalExposureSales
  salesRow1.getCell(7).numFmt = '$#,##0'

  // Row 13: Sales line 2
  const salesRow2 = ws.getRow(13)
  salesRow2.getCell(2).value = 'Direct Sales:'
  salesRow2.getCell(3).value = totalDirectSales
  salesRow2.getCell(3).numFmt = '$#,##0'
  salesRow2.getCell(4).value = 'Marketplace Sales:'
  salesRow2.getCell(5).value = totalMarketplaceSales
  salesRow2.getCell(5).numFmt = '$#,##0'

  // Row 15: LIABILITY SUMMARY header
  applySectionHeader(ws.getRow(15), 'LIABILITY SUMMARY', 9)

  // Calculate liability totals using detailed state data
  let totalTaxLiability = 0
  let totalInterest = 0
  let totalPenalties = 0

  for (const state of nexusStates) {
    const detail = data.stateDetails.get(state.state_code)
    if (detail) {
      totalTaxLiability += detail.base_tax
      totalInterest += detail.interest
      totalPenalties += detail.penalties
    } else {
      totalTaxLiability += state.base_tax ?? state.estimated_liability
      totalInterest += state.interest ?? 0
      totalPenalties += state.penalties ?? 0
    }
  }

  const grandTotalLiability = totalTaxLiability + totalInterest + totalPenalties

  // Row 17: Liability values
  const liabilityRow = ws.getRow(17)
  liabilityRow.getCell(2).value = 'Tax Liability:'
  liabilityRow.getCell(3).value = totalTaxLiability
  liabilityRow.getCell(3).numFmt = '$#,##0.00'
  liabilityRow.getCell(4).value = 'Interest:'
  liabilityRow.getCell(5).value = totalInterest
  liabilityRow.getCell(5).numFmt = '$#,##0.00'
  liabilityRow.getCell(6).value = 'Penalties:'
  liabilityRow.getCell(7).value = totalPenalties
  liabilityRow.getCell(7).numFmt = '$#,##0.00'
  liabilityRow.getCell(8).value = 'Total Liability:'
  const totalLiabilityCell = liabilityRow.getCell(9)
  totalLiabilityCell.value = grandTotalLiability
  totalLiabilityCell.numFmt = '$#,##0.00'
  totalLiabilityCell.font = { bold: true, color: { argb: COLORS.RED_TEXT } }

  // Row 19: STATES WITH NEXUS — RANKED BY LIABILITY header
  applySectionHeader(ws.getRow(19), 'STATES WITH NEXUS — RANKED BY LIABILITY', 7)

  // Row 20: Table headers
  const tableHeaderRow = ws.getRow(20)
  tableHeaderRow.getCell(2).value = 'State'
  tableHeaderRow.getCell(3).value = 'Status'
  tableHeaderRow.getCell(4).value = 'Trigger Date'
  tableHeaderRow.getCell(5).value = 'Tax Rate'
  tableHeaderRow.getCell(6).value = 'Total Liability'
  applyTableHeaderStyle(tableHeaderRow)

  // Add data rows (already sorted by liability desc)
  let rowNum = 21
  for (const state of nexusStates) {
    const detail = data.stateDetails.get(state.state_code)
    const row = ws.getRow(rowNum)

    row.getCell(2).value = formatStateName(state.state_code, state.state_name)
    row.getCell(3).value = getNexusStatusLabel(detail?.nexus_type || state.nexus_type)
    row.getCell(4).value = getTriggerDate(detail, state)

    // Get tax rate from compliance_info (API returns as percentage like 8.98, convert to decimal for Excel)
    const taxRate = (detail?.compliance_info?.tax_rates?.combined_rate || 0) / 100
    row.getCell(5).value = taxRate
    row.getCell(5).numFmt = '0.00%'

    const totalLiab = detail
      ? (detail.base_tax + detail.interest + detail.penalties)
      : getTotalLiability(state)
    row.getCell(6).value = totalLiab
    row.getCell(6).numFmt = '$#,##0'

    // Conditional formatting: highlight > $25,000
    if (totalLiab > 25000) {
      row.getCell(6).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.RED_FILL }
      }
    }

    applyDataCellBorders(row)
    row.alignment = { horizontal: 'center', vertical: 'middle' }
    rowNum++
  }

  // Add autofilter
  if (nexusStates.length > 0) {
    ws.autoFilter = {
      from: { row: 20, column: 2 },
      to: { row: 20 + nexusStates.length, column: 6 }
    }
  }
}

/**
 * Sheet 2: State Summary - Detailed metrics for nexus states only
 */
function createStateSummarySheet(
  workbook: ExcelJS.Workbook,
  data: ExportData,
  nexusStates: StateResult[]
): void {
  const ws = workbook.addWorksheet('State Summary')

  // Set column widths (A is margin, B onwards is data)
  ws.columns = [
    { width: 3 },  // A - margin
    { width: 20 }, // B - State
    { width: 16 }, // C - Status
    { width: 12 }, // D - Trigger Date
    { width: 8 },  // E - Operator
    { width: 14 }, // F - Econ Threshold
    { width: 12 }, // G - Trans Threshold
    { width: 12 }, // H - Threshold Met
    { width: 12 }, // I - Transactions
    { width: 14 }, // J - Gross Sales
    { width: 14 }, // K - Taxable Sales
    { width: 14 }, // L - Exempt Sales
    { width: 14 }, // M - Direct Sales
    { width: 14 }, // N - Marketplace Sales
    { width: 14 }, // O - Exposure Sales
    { width: 10 }, // P - Tax Rate
    { width: 14 }, // Q - Tax Liability
    { width: 12 }, // R - Interest
    { width: 12 }, // S - Penalties
    { width: 14 }, // T - Total Liability
  ]

  // Row 2: Title
  const titleRow = ws.getRow(2)
  ws.mergeCells('B2:T2')
  const titleCell = titleRow.getCell(2)
  titleCell.value = 'State Nexus Analysis — Detailed Summary'
  titleCell.font = { bold: true, size: 16, color: { argb: COLORS.DARK_BLUE } }
  titleCell.alignment = { horizontal: 'left' }

  // Row 3: Subtitle
  const subtitleRow = ws.getRow(3)
  ws.mergeCells('B3:T3')
  const subtitleCell = subtitleRow.getCell(2)
  const generatedDate = formatDateLong(new Date().toISOString())
  subtitleCell.value = `${data.analysis.client_company_name} — Generated ${generatedDate}`
  subtitleCell.font = { italic: true, color: { argb: COLORS.GRAY_TEXT } }

  // Row 5: Table headers
  const headerRow = ws.getRow(5)
  const headers = [
    '', 'State', 'Status', 'Trigger Date', 'Operator', 'Econ Threshold',
    'Trans Threshold', 'Threshold Met', 'Transactions', 'Gross Sales',
    'Taxable Sales', 'Exempt Sales', 'Direct Sales', 'Marketplace Sales',
    'Exposure Sales', 'Tax Rate', 'Tax Liability', 'Interest', 'Penalties', 'Total Liability'
  ]
  headers.forEach((h, i) => {
    if (i > 0) headerRow.getCell(i + 1).value = h
  })
  applyTableHeaderStyle(headerRow)

  // Add data rows
  let rowNum = 6
  for (const state of nexusStates) {
    const detail = data.stateDetails.get(state.state_code)
    const row = ws.getRow(rowNum)

    row.getCell(2).value = formatStateName(state.state_code, state.state_name)

    // Status with green fill for nexus states
    const nexusType = detail?.nexus_type || state.nexus_type
    const statusCell = row.getCell(3)
    statusCell.value = getNexusStatusLabel(nexusType)
    if (nexusType !== 'none') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.GREEN_FILL }
      }
    }

    row.getCell(4).value = getTriggerDate(detail, state)

    // Get threshold info from compliance_info
    const thresholdOp = detail?.compliance_info?.threshold_info?.threshold_operator || state.threshold_operator || 'or'
    row.getCell(5).value = thresholdOp.toUpperCase()

    const econThreshold = detail?.compliance_info?.threshold_info?.revenue_threshold || state.threshold || 0
    row.getCell(6).value = econThreshold
    row.getCell(6).numFmt = '$#,##0'

    const transThreshold = detail?.compliance_info?.threshold_info?.transaction_threshold || state.transaction_threshold
    row.getCell(7).value = transThreshold ? transThreshold : 'N/A'

    // Threshold Met with green fill
    const thresholdMetCell = row.getCell(8)
    const thresholdMet = state.threshold_percent >= 100 ? 'Met' : `${state.threshold_percent.toFixed(0)}%`
    thresholdMetCell.value = thresholdMet
    if (thresholdMet === 'Met') {
      thresholdMetCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.GREEN_FILL }
      }
    }

    // Use detail data for accurate numbers
    row.getCell(9).value = detail?.transaction_count || state.transaction_count || 0
    row.getCell(9).numFmt = '#,##0'

    row.getCell(10).value = detail?.total_sales || state.total_sales
    row.getCell(10).numFmt = '$#,##0'

    row.getCell(11).value = detail?.taxable_sales || state.taxable_sales || 0
    row.getCell(11).numFmt = '$#,##0'

    row.getCell(12).value = detail?.exempt_sales || state.exempt_sales || 0
    row.getCell(12).numFmt = '$#,##0'

    row.getCell(13).value = detail?.direct_sales || state.direct_sales || 0
    row.getCell(13).numFmt = '$#,##0'

    row.getCell(14).value = detail?.marketplace_sales || state.marketplace_sales || 0
    row.getCell(14).numFmt = '$#,##0'

    row.getCell(15).value = detail?.exposure_sales || state.exposure_sales || 0
    row.getCell(15).numFmt = '$#,##0'

    // Tax rate from compliance info (API returns as percentage like 8.98, convert to decimal for Excel)
    const taxRate = (detail?.compliance_info?.tax_rates?.combined_rate || 0) / 100
    row.getCell(16).value = taxRate
    row.getCell(16).numFmt = '0.00%'

    const baseTax = detail?.base_tax ?? (state.base_tax ?? state.estimated_liability)
    const interest = detail?.interest ?? (state.interest ?? 0)
    const penalties = detail?.penalties ?? (state.penalties ?? 0)
    const totalLiab = baseTax + interest + penalties

    row.getCell(17).value = baseTax
    row.getCell(17).numFmt = '$#,##0'

    row.getCell(18).value = interest
    row.getCell(18).numFmt = '$#,##0'

    row.getCell(19).value = penalties
    row.getCell(19).numFmt = '$#,##0'

    // Total Liability with red fill if > $25,000
    const totalLiabCell = row.getCell(20)
    totalLiabCell.value = totalLiab
    totalLiabCell.numFmt = '$#,##0'
    if (totalLiab > 25000) {
      totalLiabCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.RED_FILL }
      }
    }

    applyDataCellBorders(row)
    row.alignment = { horizontal: 'center', vertical: 'middle' }
    rowNum++
  }

  // Add autofilter
  if (nexusStates.length > 0) {
    ws.autoFilter = {
      from: { row: 5, column: 2 },
      to: { row: 5 + nexusStates.length, column: 20 }
    }
  }
}

/**
 * Sheet 3: Year-by-Year - Annual breakdown by state (nexus states only)
 */
function createYearByYearSheet(
  workbook: ExcelJS.Workbook,
  data: ExportData,
  nexusStates: StateResult[]
): void {
  const ws = workbook.addWorksheet('Year-by-Year')

  // Set column widths
  ws.columns = [
    { width: 3 },  // A - margin
    { width: 20 }, // B - State
    { width: 8 },  // C - Year
    { width: 12 }, // D - Transactions
    { width: 14 }, // E - Gross Sales
    { width: 14 }, // F - Exempt Sales
    { width: 14 }, // G - Taxable Sales
    { width: 14 }, // H - Exposure Sales
    { width: 14 }, // I - Tax Liability
    { width: 12 }, // J - P&I
    { width: 14 }, // K - Total Liability
  ]

  // Row 2: Title
  const titleRow = ws.getRow(2)
  ws.mergeCells('B2:K2')
  const titleCell = titleRow.getCell(2)
  titleCell.value = 'Year-by-Year Breakdown — Nexus States Only'
  titleCell.font = { bold: true, size: 16, color: { argb: COLORS.DARK_BLUE } }
  titleCell.alignment = { horizontal: 'left' }

  // Row 4: Table headers
  const headerRow = ws.getRow(4)
  const headers = ['', 'State', 'Year', 'Transactions', 'Gross Sales', 'Exempt Sales',
    'Taxable Sales', 'Exposure Sales', 'Tax Liability', 'P&I', 'Total Liability']
  headers.forEach((h, i) => {
    if (i > 0) headerRow.getCell(i + 1).value = h
  })
  applyTableHeaderStyle(headerRow)

  // Collect all year data from state details
  interface YearRow {
    state: string
    stateCode: string
    year: number
    transactions: number
    grossSales: number
    exemptSales: number
    taxableSales: number
    exposureSales: number
    taxLiability: number
    pAndI: number
    totalLiability: number
  }

  const yearRows: YearRow[] = []

  for (const state of nexusStates) {
    const detail = data.stateDetails.get(state.state_code)
    const yearData = detail?.year_data || state.year_data

    if (yearData && yearData.length > 0) {
      for (const yd of yearData) {
        const baseTax = yd.summary?.base_tax || yd.summary?.estimated_liability || 0
        const interest = yd.summary?.interest || 0
        const penalties = yd.summary?.penalties || 0

        yearRows.push({
          state: formatStateName(state.state_code, state.state_name),
          stateCode: state.state_code,
          year: yd.year,
          transactions: yd.summary?.transaction_count || 0,
          grossSales: yd.summary?.total_sales || 0,
          exemptSales: yd.summary?.exempt_sales || 0,
          taxableSales: yd.summary?.taxable_sales || 0,
          exposureSales: yd.summary?.exposure_sales || 0,
          taxLiability: baseTax,
          pAndI: interest + penalties,
          totalLiability: baseTax + interest + penalties
        })
      }
    }
  }

  // Sort by state alpha, then year ascending
  yearRows.sort((a, b) => {
    const stateCompare = a.state.localeCompare(b.state)
    if (stateCompare !== 0) return stateCompare
    return a.year - b.year
  })

  // Add data rows
  let rowNum = 5
  for (const yr of yearRows) {
    const row = ws.getRow(rowNum)

    row.getCell(2).value = yr.state
    row.getCell(3).value = yr.year
    row.getCell(3).numFmt = '0' // No thousands separator for year

    row.getCell(4).value = yr.transactions
    row.getCell(4).numFmt = '#,##0'

    row.getCell(5).value = yr.grossSales
    row.getCell(5).numFmt = '$#,##0'

    row.getCell(6).value = yr.exemptSales
    row.getCell(6).numFmt = '$#,##0'

    row.getCell(7).value = yr.taxableSales
    row.getCell(7).numFmt = '$#,##0'

    row.getCell(8).value = yr.exposureSales
    row.getCell(8).numFmt = '$#,##0'

    row.getCell(9).value = yr.taxLiability
    row.getCell(9).numFmt = '$#,##0'

    row.getCell(10).value = yr.pAndI
    row.getCell(10).numFmt = '$#,##0'

    row.getCell(11).value = yr.totalLiability
    row.getCell(11).numFmt = '$#,##0'

    applyDataCellBorders(row)
    row.alignment = { horizontal: 'center', vertical: 'middle' }
    rowNum++
  }

  // Add autofilter
  if (yearRows.length > 0) {
    ws.autoFilter = {
      from: { row: 4, column: 2 },
      to: { row: 4 + yearRows.length, column: 11 }
    }
  }
}

/**
 * Sheet 4: Transactions - Transaction-level detail with running totals and threshold indicators
 * Uses detailed transaction data from state detail API
 */
function createTransactionsSheet(
  workbook: ExcelJS.Workbook,
  data: ExportData,
  nexusStates: StateResult[]
): void {
  const ws = workbook.addWorksheet('Transactions')

  // Set column widths
  ws.columns = [
    { width: 3 },  // A - margin
    { width: 20 }, // B - State
    { width: 12 }, // C - Date
    { width: 10 }, // D - Trans #
    { width: 14 }, // E - Gross Sales
    { width: 14 }, // F - Taxable
    { width: 14 }, // G - Exempt
    { width: 14 }, // H - Channel
    { width: 16 }, // I - YTD Gross Sales
    { width: 10 }, // J - YTD Trans
    { width: 16 }, // K - Exemption Reason
  ]

  // Row 2: Title
  const titleRow = ws.getRow(2)
  ws.mergeCells('B2:K2')
  const titleCell = titleRow.getCell(2)
  titleCell.value = 'Transaction Detail — All Nexus States'
  titleCell.font = { bold: true, size: 16, color: { argb: COLORS.DARK_BLUE } }
  titleCell.alignment = { horizontal: 'left' }

  // Row 3: Subtitle explaining yellow highlight
  const subtitleRow = ws.getRow(3)
  ws.mergeCells('B3:K3')
  const subtitleCell = subtitleRow.getCell(2)
  subtitleCell.value = 'Yellow highlighted rows indicate when economic nexus threshold was crossed'
  subtitleCell.font = { italic: true, color: { argb: COLORS.GRAY_TEXT } }

  // Row 5: Table headers
  const headerRow = ws.getRow(5)
  const headers = ['', 'State', 'Date', 'Trans #', 'Gross Sales', 'Taxable',
    'Exempt', 'Channel', 'YTD Gross Sales', 'YTD Trans', 'Exemption Reason']
  headers.forEach((h, i) => {
    if (i > 0) headerRow.getCell(i + 1).value = h
  })
  applyTableHeaderStyle(headerRow)

  // Collect all transactions from state detail data
  interface RawTransaction {
    stateCode: string
    stateName: string
    date: string
    grossSales: number
    taxable: number
    exempt: number
    channel: string
    runningTotal: number
  }

  const allTransactions: RawTransaction[] = []

  // Build threshold info and nexus types for threshold crossing detection
  const stateThresholds: Map<string, number> = new Map()
  const stateNexusTypes: Map<string, string> = new Map()

  for (const state of nexusStates) {
    const detail = data.stateDetails.get(state.state_code)
    const threshold = detail?.compliance_info?.threshold_info?.revenue_threshold || state.threshold || 0
    const nexusType = detail?.nexus_type || state.nexus_type

    stateThresholds.set(state.state_code, threshold)
    stateNexusTypes.set(state.state_code, nexusType)

    // Get transactions from detail year_data
    const yearData = detail?.year_data || state.year_data
    if (yearData) {
      for (const yd of yearData) {
        if (yd.transactions && yd.transactions.length > 0) {
          for (const tx of yd.transactions) {
            allTransactions.push({
              stateCode: state.state_code,
              stateName: formatStateName(state.state_code, state.state_name),
              date: tx.transaction_date,
              grossSales: tx.sales_amount,
              taxable: tx.taxable_amount,
              exempt: tx.exempt_amount,
              channel: tx.sales_channel,
              runningTotal: tx.running_total
            })
          }
        }
      }
    }
  }

  // Sort by state, then by date to ensure chronological processing
  allTransactions.sort((a, b) => {
    const stateCompare = a.stateName.localeCompare(b.stateName)
    if (stateCompare !== 0) return stateCompare
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  // Process transactions to add YTD counts and identify threshold crossings
  const transactionsToExport: TransactionRow[] = []
  const stateCumulative: Map<string, number> = new Map()
  const stateHighlighted: Map<string, boolean> = new Map()
  const stateYearTransCount: Map<string, number> = new Map() // key: stateCode-year

  for (const tx of allTransactions) {
    const year = new Date(tx.date).getFullYear()
    const ytdKey = `${tx.stateCode}-${year}`

    // Increment YTD transaction count
    const currentYtdCount = stateYearTransCount.get(ytdKey) || 0
    stateYearTransCount.set(ytdKey, currentYtdCount + 1)

    // Track cumulative for threshold crossing (across all years)
    const prevCumulative = stateCumulative.get(tx.stateCode) || 0
    const newCumulative = prevCumulative + tx.grossSales
    stateCumulative.set(tx.stateCode, newCumulative)

    // Check if this transaction crosses the threshold
    const threshold = stateThresholds.get(tx.stateCode) || 0
    const nexusType = stateNexusTypes.get(tx.stateCode) || 'none'
    const alreadyHighlighted = stateHighlighted.get(tx.stateCode) || false

    // Only highlight for Economic or Physical+Economic nexus types
    const shouldCheckThreshold = nexusType === 'economic' || nexusType === 'both'
    const crossedThreshold = shouldCheckThreshold &&
      !alreadyHighlighted &&
      threshold > 0 &&
      prevCumulative < threshold &&
      newCumulative >= threshold

    if (crossedThreshold) {
      stateHighlighted.set(tx.stateCode, true)
    }

    transactionsToExport.push({
      state: tx.stateName,
      stateCode: tx.stateCode,
      date: tx.date,
      transNum: stateYearTransCount.get(ytdKey) || 1,
      grossSales: tx.grossSales,
      taxable: tx.taxable,
      exempt: tx.exempt,
      channel: tx.channel,
      ytdGrossSales: tx.runningTotal, // Use the running total from the API
      ytdTrans: stateYearTransCount.get(ytdKey) || 1,
      exemptionReason: '',
      crossedThreshold
    })
  }

  // Add data rows
  let rowNum = 6
  let alternateRow = false

  for (const tx of transactionsToExport) {
    const row = ws.getRow(rowNum)

    row.getCell(2).value = tx.state
    row.getCell(3).value = tx.date
    row.getCell(4).value = tx.transNum
    row.getCell(4).numFmt = '#,##0'

    row.getCell(5).value = tx.grossSales
    row.getCell(5).numFmt = '$#,##0'

    row.getCell(6).value = tx.taxable
    row.getCell(6).numFmt = '$#,##0'

    row.getCell(7).value = tx.exempt
    row.getCell(7).numFmt = '$#,##0'

    row.getCell(8).value = tx.channel

    row.getCell(9).value = tx.ytdGrossSales
    row.getCell(9).numFmt = '$#,##0'

    row.getCell(10).value = tx.ytdTrans
    row.getCell(10).numFmt = '#,##0'

    row.getCell(11).value = tx.exemptionReason

    // Apply row styling
    if (tx.crossedThreshold) {
      // Yellow highlight for threshold crossing
      for (let col = 2; col <= 11; col++) {
        row.getCell(col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLORS.YELLOW_FILL }
        }
      }
    } else if (alternateRow) {
      // Alternate row shading
      for (let col = 2; col <= 11; col++) {
        row.getCell(col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLORS.ALT_ROW }
        }
      }
    }

    applyDataCellBorders(row)
    row.alignment = { horizontal: 'center', vertical: 'middle' }

    alternateRow = !alternateRow
    rowNum++
  }

  // Add autofilter
  if (transactionsToExport.length > 0) {
    ws.autoFilter = {
      from: { row: 5, column: 2 },
      to: { row: 5 + transactionsToExport.length, column: 11 }
    }
  }
}

/**
 * Sheet 5: Documentation - Self-contained reference guide
 */
function createDocumentationSheet(
  workbook: ExcelJS.Workbook,
  data: ExportData,
  nexusStates: StateResult[]
): void {
  const ws = workbook.addWorksheet('Documentation')

  // Set column widths
  ws.columns = [
    { width: 3 },  // A - margin
    { width: 100 }, // B - Content
    { width: 3 },  // C - margin
  ]

  // Row 2: Title
  const titleRow = ws.getRow(2)
  const titleCell = titleRow.getCell(2)
  titleCell.value = 'Documentation'
  titleCell.font = { bold: true, size: 16, color: { argb: COLORS.DARK_BLUE } }

  // Helper to add a section header
  const addSectionHeader = (rowNum: number, text: string): number => {
    const row = ws.getRow(rowNum)
    const cell = row.getCell(2)
    cell.value = text
    cell.font = { bold: true, size: 11, underline: true }
    return rowNum + 1
  }

  // Helper to add a bullet point
  const addBullet = (rowNum: number, text: string): number => {
    const row = ws.getRow(rowNum)
    row.getCell(2).value = `• ${text}`
    return rowNum + 1
  }

  let rowNum = 4

  // Section: Column Definitions — State Summary
  rowNum = addSectionHeader(rowNum, 'Column Definitions — State Summary')
  rowNum = addBullet(rowNum, 'State: State name with two-letter abbreviation')
  rowNum = addBullet(rowNum, 'Status: Physical Nexus, Economic Nexus, Physical + Economic, or No Nexus')
  rowNum = addBullet(rowNum, 'Trigger Date: Date when nexus obligation began (threshold exceeded or physical presence established)')
  rowNum = addBullet(rowNum, 'Operator: OR = meet either threshold; AND = must meet both thresholds')
  rowNum = addBullet(rowNum, 'Econ Threshold: Sales dollar amount that triggers economic nexus')
  rowNum = addBullet(rowNum, 'Trans Threshold: Transaction count that triggers nexus (N/A = state uses sales only)')
  rowNum = addBullet(rowNum, 'Threshold Met: Whether company exceeds the state\'s nexus thresholds')
  rowNum = addBullet(rowNum, 'Transactions: Number of transactions in the state')
  rowNum = addBullet(rowNum, 'Gross Sales: Total sales in the state before exemptions')
  rowNum = addBullet(rowNum, 'Taxable Sales: Sales subject to sales tax')
  rowNum = addBullet(rowNum, 'Exempt Sales: Sales exempt from tax (resale certificates, exempt entities, etc.)')
  rowNum = addBullet(rowNum, 'Direct Sales: Sales made directly by the company (creates nexus exposure)')
  rowNum = addBullet(rowNum, 'Marketplace Sales: Sales made through marketplace facilitators (marketplace remits tax)')
  rowNum = addBullet(rowNum, 'Exposure Sales: Direct sales made after nexus triggered, subject to liability calculation')
  rowNum = addBullet(rowNum, 'Tax Rate: Blended state + local tax rate used for liability estimation')
  rowNum = addBullet(rowNum, 'Estimated Tax Liability: Estimated uncollected tax owed')
  rowNum = addBullet(rowNum, 'Estimated Interest: Estimated interest on unpaid tax')
  rowNum = addBullet(rowNum, 'Estimated Penalties: Estimated penalties for non-filing/non-payment')
  rowNum = addBullet(rowNum, 'Total Estimated Liability: Estimated Tax Liability + Estimated Interest + Estimated Penalties')
  rowNum++

  // Section: Nexus Status Definitions
  rowNum = addSectionHeader(rowNum, 'Nexus Status Definitions')
  rowNum = addBullet(rowNum, 'Physical Nexus: Company has physical presence (office, employees, inventory, trade shows)')
  rowNum = addBullet(rowNum, 'Economic Nexus: Sales and/or transactions exceed state threshold')
  rowNum = addBullet(rowNum, 'Physical + Economic: Both conditions are met')
  rowNum = addBullet(rowNum, 'No Nexus: Neither condition is met — no filing obligation')
  rowNum++

  // Section: Transaction Sheet Columns
  rowNum = addSectionHeader(rowNum, 'Transaction Sheet Columns')
  rowNum = addBullet(rowNum, 'Trans #: Transaction number within the year for that state')
  rowNum = addBullet(rowNum, 'YTD Gross Sales: Year-to-date cumulative gross sales (resets each year)')
  rowNum = addBullet(rowNum, 'YTD Trans: Year-to-date transaction count')
  rowNum = addBullet(rowNum, 'Yellow highlighted rows: Transaction where economic nexus threshold was crossed')
  rowNum++

  // Section: Key Concepts
  rowNum = addSectionHeader(rowNum, 'Key Concepts')
  rowNum = addBullet(rowNum, 'Exposure Sales vs Gross Sales: Exposure Sales are only Direct Sales made AFTER nexus was triggered.')
  const conceptRow = ws.getRow(rowNum)
  conceptRow.getCell(2).value = '  Marketplace Sales are excluded because the marketplace facilitator remits tax.'
  rowNum++
  rowNum = addBullet(rowNum, 'Trigger Date: The date nexus was established. For economic nexus, this is when thresholds were exceeded.')
  const triggerRow = ws.getRow(rowNum)
  triggerRow.getCell(2).value = '  For physical nexus, this is the date physical presence began (user-provided).'
  rowNum++
  rowNum++

  // Section: Economic Nexus Thresholds (This Analysis)
  rowNum = addSectionHeader(rowNum, 'Economic Nexus Thresholds (This Analysis)')

  // List thresholds for states in this analysis using detail data
  for (const state of nexusStates) {
    const detail = data.stateDetails.get(state.state_code)
    const econThreshold = detail?.compliance_info?.threshold_info?.revenue_threshold || state.threshold
    const transThreshold = detail?.compliance_info?.threshold_info?.transaction_threshold || state.transaction_threshold
    const thresholdOp = detail?.compliance_info?.threshold_info?.threshold_operator || state.threshold_operator || 'or'

    const threshold = econThreshold ? `$${econThreshold.toLocaleString()}` : 'N/A'
    const operatorLabel = thresholdOp.toUpperCase() === 'AND' ? 'AND' : 'OR'
    const tranThresholdStr = transThreshold
      ? ` ${operatorLabel} ${transThreshold.toLocaleString()} transactions${operatorLabel === 'AND' ? ' (both required)' : ''}`
      : ' (no transaction threshold)'
    rowNum = addBullet(rowNum, `${state.state_name}: ${threshold}${tranThresholdStr}`)
  }
  rowNum++

  // Section: Conditional Formatting
  rowNum = addSectionHeader(rowNum, 'Conditional Formatting')
  rowNum = addBullet(rowNum, 'Total Liability cells > $25,000 highlighted in red/pink')
  rowNum = addBullet(rowNum, 'Nexus Status and Threshold Met cells highlighted in green')
  rowNum = addBullet(rowNum, 'Transaction rows where threshold crossed highlighted in yellow')
}

/**
 * Generate filename for the export
 */
export function generateExportFilename(companyName: string): string {
  const sanitizedName = companyName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '-')
  const currentDate = new Date().toISOString().split('T')[0]
  return `${sanitizedName}-Nexus-Analysis-${currentDate}.xlsx`
}
