import PDFDocument from 'pdfkit'
import { DateTime } from 'luxon'
import Transaction from '#models/transaction'
import FintracRecord from '#models/fintrac_record'

export interface PdfExportOptions {
  includeOffers: boolean
  includeConditions: boolean
  includeDocuments: boolean
  includeActivity: boolean
  watermark: boolean
  language: 'fr' | 'en'
}

interface TransactionData {
  transaction: Transaction
}

const LABELS = {
  fr: {
    title: 'Rapport de transaction',
    property: 'Propriété',
    client: 'Client',
    status: 'Statut',
    type: 'Type',
    salePrice: 'Prix de vente',
    listPrice: 'Prix demandé',
    commission: 'Commission',
    closingDate: 'Date de clôture',
    offerExpiry: 'Expiration de l\'offre',
    inspectionDeadline: 'Date limite d\'inspection',
    financingDeadline: 'Date limite de financement',
    offers: 'Offres',
    offerFrom: 'De',
    offerTo: 'À',
    offerDirection: 'Direction',
    buyerToSeller: 'Acheteur → Vendeur',
    sellerToBuyer: 'Vendeur → Acheteur',
    conditions: 'Conditions',
    documents: 'Documents',
    activity: 'Historique d\'activité',
    price: 'Prix',
    deposit: 'Dépôt',
    offerStatus: 'Statut',
    level: 'Niveau',
    dueDate: 'Échéance',
    conditionStatus: 'Statut',
    category: 'Catégorie',
    documentStatus: 'Statut',
    pages: 'pages',
    generatedAt: 'Généré le',
    confidential: 'CONFIDENTIEL',
    purchase: 'Achat',
    sale: 'Vente',
    active: 'Active',
    cancelled: 'Annulée',
    archived: 'Archivée',
    noData: 'Aucune donnée',
    keyDates: 'Dates clés',
    parties: 'Parties prenantes',
    fintrac: 'Conformité FINTRAC',
    fintracParty: 'Partie',
    fintracDob: 'Date de naissance',
    fintracIdType: 'Type de pièce',
    fintracIdNumber: 'Numéro',
    fintracOccupation: 'Profession',
    fintracSourceOfFunds: 'Source des fonds',
    fintracVerifiedAt: 'Vérifié le',
    fintracVerifiedBy: 'Vérifié par',
    fintracPending: 'En attente de vérification',
    fintracDriversLicense: 'Permis de conduire',
    fintracCanadianPassport: 'Passeport canadien',
    fintracForeignPassport: 'Passeport étranger',
    fintracCitizenshipCard: 'Carte de citoyenneté',
    fintracOtherGovId: 'Autre pièce gouvernementale',
  },
  en: {
    title: 'Transaction Report',
    property: 'Property',
    client: 'Client',
    status: 'Status',
    type: 'Type',
    salePrice: 'Sale Price',
    listPrice: 'List Price',
    commission: 'Commission',
    closingDate: 'Closing Date',
    offerExpiry: 'Offer Expiry',
    inspectionDeadline: 'Inspection Deadline',
    financingDeadline: 'Financing Deadline',
    offers: 'Offers',
    offerFrom: 'From',
    offerTo: 'To',
    offerDirection: 'Direction',
    buyerToSeller: 'Buyer → Seller',
    sellerToBuyer: 'Seller → Buyer',
    conditions: 'Conditions',
    documents: 'Documents',
    activity: 'Activity History',
    price: 'Price',
    deposit: 'Deposit',
    offerStatus: 'Status',
    level: 'Level',
    dueDate: 'Due Date',
    conditionStatus: 'Status',
    category: 'Category',
    documentStatus: 'Status',
    pages: 'pages',
    generatedAt: 'Generated on',
    confidential: 'CONFIDENTIAL',
    purchase: 'Purchase',
    sale: 'Sale',
    active: 'Active',
    cancelled: 'Cancelled',
    archived: 'Archived',
    noData: 'No data',
    keyDates: 'Key Dates',
    parties: 'Stakeholders',
    fintrac: 'FINTRAC Compliance',
    fintracParty: 'Party',
    fintracDob: 'Date of Birth',
    fintracIdType: 'ID Type',
    fintracIdNumber: 'ID Number',
    fintracOccupation: 'Occupation',
    fintracSourceOfFunds: 'Source of Funds',
    fintracVerifiedAt: 'Verified on',
    fintracVerifiedBy: 'Verified by',
    fintracPending: 'Pending verification',
    fintracDriversLicense: "Driver's license",
    fintracCanadianPassport: 'Canadian passport',
    fintracForeignPassport: 'Foreign passport',
    fintracCitizenshipCard: 'Citizenship card',
    fintracOtherGovId: 'Other government ID',
  },
}

export class PdfExportService {
  /**
   * Generate PDF buffer for a transaction
   */
  static async generate(data: TransactionData, options: PdfExportOptions): Promise<Buffer> {
    const { transaction } = data
    const l = LABELS[options.language]

    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
      info: {
        Title: `${l.title} — ${transaction.client?.firstName || ''} ${transaction.client?.lastName || ''}`,
        Author: 'OFRA',
      },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))

    // Watermark on every page
    if (options.watermark) {
      doc.on('pageAdded', () => {
        addWatermark(doc, l.confidential)
      })
      addWatermark(doc, l.confidential)
    }

    // ---- HEADER ----
    doc.fontSize(20).font('Helvetica-Bold').text(l.title, { align: 'center' })
    doc.moveDown(0.3)
    doc.fontSize(9).font('Helvetica')
      .text(`${l.generatedAt} ${DateTime.now().toFormat('yyyy-MM-dd HH:mm')}`, { align: 'center' })
    doc.moveDown(1.5)

    // ---- TRANSACTION INFO ----
    const clientName = transaction.client
      ? `${transaction.client.firstName} ${transaction.client.lastName}`
      : '-'
    const propertyAddr = transaction.property
      ? [transaction.property.address, transaction.property.city, transaction.property.postalCode].filter(Boolean).join(', ')
      : '-'

    addSection(doc, l.client, clientName)
    addSection(doc, l.property, propertyAddr)
    addSection(doc, l.type, options.language === 'fr'
      ? (transaction.type === 'purchase' ? l.purchase : l.sale)
      : (transaction.type === 'purchase' ? l.purchase : l.sale))
    addSection(doc, l.status, l[transaction.status as keyof typeof l] as string || transaction.status)

    if (transaction.salePrice) addSection(doc, l.salePrice, formatMoney(transaction.salePrice))
    if (transaction.listPrice) addSection(doc, l.listPrice, formatMoney(transaction.listPrice))
    if (transaction.commission) addSection(doc, l.commission, `${transaction.commission}%`)

    // Key dates
    doc.moveDown(0.8)
    doc.fontSize(14).font('Helvetica-Bold').text(l.keyDates)
    doc.moveDown(0.3)
    doc.fontSize(10).font('Helvetica')
    if (transaction.closingDate) addSection(doc, l.closingDate, formatDate(transaction.closingDate))
    if (transaction.offerExpiryDate) addSection(doc, l.offerExpiry, formatDate(transaction.offerExpiryDate))
    if (transaction.inspectionDeadline) addSection(doc, l.inspectionDeadline, formatDate(transaction.inspectionDeadline))
    if (transaction.financingDeadline) addSection(doc, l.financingDeadline, formatDate(transaction.financingDeadline))

    // Parties
    if (transaction.parties && transaction.parties.length > 0) {
      doc.moveDown(0.8)
      doc.fontSize(14).font('Helvetica-Bold').text(l.parties)
      doc.moveDown(0.3)
      doc.fontSize(10).font('Helvetica')
      for (const party of transaction.parties) {
        doc.text(`${party.role}: ${party.fullName}${party.email ? ` (${party.email})` : ''}`)
      }
    }

    // ---- OFFERS ----
    if (options.includeOffers && transaction.offers) {
      doc.addPage()
      if (options.watermark) addWatermark(doc, l.confidential)
      doc.fontSize(16).font('Helvetica-Bold').text(l.offers)
      doc.moveDown(0.5)

      if (transaction.offers.length === 0) {
        doc.fontSize(10).font('Helvetica').text(l.noData)
      } else {
        for (const offer of transaction.offers) {
          doc.fontSize(11).font('Helvetica-Bold')
            .text(`${l.offerStatus}: ${offer.status}`)
          if (offer.revisions && offer.revisions.length > 0) {
            for (const rev of offer.revisions) {
              doc.fontSize(10).font('Helvetica')
              // Nominative display with fallback
              const fromName = rev.fromParty?.fullName
              const toName = rev.toParty?.fullName
              if (fromName || toName) {
                doc.text(`  #${rev.revisionNumber} — ${fromName ?? '?'} → ${toName ?? '?'}`)
              } else {
                const dirLabel = rev.direction === 'buyer_to_seller' ? l.buyerToSeller : l.sellerToBuyer
                doc.text(`  #${rev.revisionNumber} — ${dirLabel}`)
              }
              doc.text(`  ${l.price}: ${formatMoney(rev.price)}`)
              if (rev.deposit) doc.text(`  ${l.deposit}: ${formatMoney(rev.deposit)}`)
            }
          }
          doc.moveDown(0.5)
        }
      }
    }

    // ---- CONDITIONS ----
    if (options.includeConditions && transaction.conditions) {
      doc.addPage()
      if (options.watermark) addWatermark(doc, l.confidential)
      doc.fontSize(16).font('Helvetica-Bold').text(l.conditions)
      doc.moveDown(0.5)

      if (transaction.conditions.length === 0) {
        doc.fontSize(10).font('Helvetica').text(l.noData)
      } else {
        for (const cond of transaction.conditions) {
          doc.fontSize(11).font('Helvetica-Bold').text(cond.title)
          doc.fontSize(10).font('Helvetica')
          doc.text(`  ${l.level}: ${cond.level} | ${l.conditionStatus}: ${cond.status}`)
          if (cond.dueDate) doc.text(`  ${l.dueDate}: ${formatDate(cond.dueDate)}`)
          doc.moveDown(0.3)
        }
      }
    }

    // ---- FINTRAC ----
    {
      const fintracRecords = await FintracRecord.query()
        .where('transactionId', transaction.id)
        .preload('party')
        .preload('verifiedBy')
        .orderBy('createdAt', 'asc')

      if (fintracRecords.length > 0) {
        doc.addPage()
        if (options.watermark) addWatermark(doc, l.confidential)
        doc.fontSize(16).font('Helvetica-Bold').text(l.fintrac)
        doc.moveDown(0.5)

        for (const rec of fintracRecords) {
          doc.fontSize(11).font('Helvetica-Bold')
            .text(`${l.fintracParty}: ${rec.party?.fullName ?? '-'}`)
          doc.fontSize(10).font('Helvetica')

          if (rec.verifiedAt) {
            const idTypeMap: Record<string, string> = {
              drivers_license: l.fintracDriversLicense,
              canadian_passport: l.fintracCanadianPassport,
              foreign_passport: l.fintracForeignPassport,
              citizenship_card: l.fintracCitizenshipCard,
              other_government_id: l.fintracOtherGovId,
            }
            const idTypeLabel = rec.idType ? (idTypeMap[rec.idType] ?? rec.idType) : '-'
            doc.text(`  ${l.fintracIdType}: ${idTypeLabel}`)
            doc.text(`  ${l.fintracIdNumber}: ${rec.idNumber ?? '-'}`)
            if (rec.dateOfBirth) doc.text(`  ${l.fintracDob}: ${formatDate(rec.dateOfBirth)}`)
            if (rec.occupation) doc.text(`  ${l.fintracOccupation}: ${rec.occupation}`)
            if (rec.sourceOfFunds) doc.text(`  ${l.fintracSourceOfFunds}: ${rec.sourceOfFunds}`)
            doc.text(`  ${l.fintracVerifiedAt}: ${formatDate(rec.verifiedAt)}`)
            if (rec.verifiedBy) doc.text(`  ${l.fintracVerifiedBy}: ${rec.verifiedBy.fullName}`)
          } else {
            doc.text(`  ${l.fintracPending}`)
          }
          doc.moveDown(0.3)
        }
      }
    }

    // ---- DOCUMENTS ----
    if (options.includeDocuments && transaction.documents) {
      doc.addPage()
      if (options.watermark) addWatermark(doc, l.confidential)
      doc.fontSize(16).font('Helvetica-Bold').text(l.documents)
      doc.moveDown(0.5)

      if (transaction.documents.length === 0) {
        doc.fontSize(10).font('Helvetica').text(l.noData)
      } else {
        for (const docItem of transaction.documents) {
          doc.fontSize(10).font('Helvetica')
            .text(`${docItem.name} — ${l.category}: ${docItem.category} | ${l.documentStatus}: ${docItem.status}`)
        }
      }
    }

    // ---- ACTIVITY ----
    if (options.includeActivity && transaction.activities) {
      doc.addPage()
      if (options.watermark) addWatermark(doc, l.confidential)
      doc.fontSize(16).font('Helvetica-Bold').text(l.activity)
      doc.moveDown(0.5)

      if (transaction.activities.length === 0) {
        doc.fontSize(10).font('Helvetica').text(l.noData)
      } else {
        for (const act of transaction.activities) {
          doc.fontSize(9).font('Helvetica')
            .text(`${formatDate(act.createdAt)} — ${act.activityType}`)
        }
      }
    }

    // Finalize
    doc.end()

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
    })
  }
}

function addSection(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.fontSize(10).font('Helvetica-Bold').text(`${label}: `, { continued: true })
  doc.font('Helvetica').text(value)
}

function addWatermark(doc: PDFKit.PDFDocument, text: string) {
  doc.save()
  doc.fontSize(60)
  doc.opacity(0.06)
  doc.font('Helvetica-Bold')
  doc.rotate(45, { origin: [306, 396] })
  doc.text(text, 120, 300, { align: 'center' })
  doc.restore()
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)
}

function formatDate(dt: DateTime | null): string {
  if (!dt) return '-'
  return dt.toFormat('yyyy-MM-dd')
}
