import { useState, useCallback, useEffect } from 'react'

// Known column mappings (same as backend csv_import_service)
const COLUMN_MAPPINGS: Record<string, string> = {
  firstname: 'firstName',
  first_name: 'firstName',
  'first name': 'firstName',
  lastname: 'lastName',
  last_name: 'lastName',
  'last name': 'lastName',
  email: 'email',
  'e-mail': 'email',
  phone: 'phone',
  telephone: 'phone',
  tel: 'phone',
  notes: 'notes',
  note: 'notes',
  comments: 'notes',
  addressline1: 'addressLine1',
  address_line1: 'addressLine1',
  'address line 1': 'addressLine1',
  address: 'addressLine1',
  addressline2: 'addressLine2',
  address_line2: 'addressLine2',
  'address line 2': 'addressLine2',
  apt: 'addressLine2',
  apartment: 'addressLine2',
  suite: 'addressLine2',
  city: 'city',
  provincestate: 'provinceState',
  province_state: 'provinceState',
  province: 'provinceState',
  state: 'provinceState',
  postalcode: 'postalCode',
  postal_code: 'postalCode',
  'postal code': 'postalCode',
  zip: 'postalCode',
  zipcode: 'postalCode',
  homephone: 'homePhone',
  home_phone: 'homePhone',
  'home phone': 'homePhone',
  workphone: 'workPhone',
  work_phone: 'workPhone',
  'work phone': 'workPhone',
  cellphone: 'cellPhone',
  cell_phone: 'cellPhone',
  'cell phone': 'cellPhone',
  mobile: 'cellPhone',
  // French
  prénom: 'firstName',
  prenom: 'firstName',
  nom: 'lastName',
  'nom de famille': 'lastName',
  courriel: 'email',
  téléphone: 'phone',
  commentaires: 'notes',
  adresse: 'addressLine1',
  ville: 'city',
  'code postal': 'postalCode',
  cellulaire: 'cellPhone',
  'tel maison': 'homePhone',
  'tel travail': 'workPhone',
  'tel cellulaire': 'cellPhone',
}

export const FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  notes: 'Notes',
  addressLine1: 'Address',
  addressLine2: 'Address 2',
  city: 'City',
  provinceState: 'Province/State',
  postalCode: 'Postal Code',
  homePhone: 'Home Phone',
  workPhone: 'Work Phone',
  cellPhone: 'Cell Phone',
}

export type CsvImportState = 'idle' | 'parsing' | 'preview' | 'error'

export interface CsvPreview {
  headers: string[]
  rows: string[][]
  totalRows: number
  mappedColumns: Map<string, string>
}

function mapColumnName(header: string): string | null {
  const normalized = header.toLowerCase().trim()
  return COLUMN_MAPPINGS[normalized] || null
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0])
  const rows = lines.slice(1).map(parseLine)

  return { headers, rows }
}

export function useCsvImport() {
  const [state, setState] = useState<CsvImportState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvPreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Parse CSV when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setPreview(null)
      return
    }

    setState('parsing')

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers, rows } = parseCSV(text)

      const mappedColumns = new Map<string, string>()
      headers.forEach((header) => {
        const mapped = mapColumnName(header)
        if (mapped) {
          mappedColumns.set(header, mapped)
        }
      })

      setPreview({
        headers,
        rows: rows.slice(0, 5),
        totalRows: rows.length,
        mappedColumns,
      })
      setState('preview')
    }
    reader.onerror = () => {
      setState('error')
      setError('Failed to read file')
    }
    reader.readAsText(selectedFile)
  }, [selectedFile])

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setState('error')
      setError('Invalid file format. Please select a .csv file.')
      return
    }
    setError(null)
    setSelectedFile(file)
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setSelectedFile(null)
    setPreview(null)
    setError(null)
  }, [])

  return {
    state,
    selectedFile,
    preview,
    error,
    handleFile,
    reset,
  }
}
