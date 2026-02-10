import { http } from './http'

export interface PackTemplate {
  id: number
  title: string
  titleEn: string | null
  description: string | null
  descriptionEn: string | null
  level: 'blocking' | 'required' | 'recommended'
  conditionType: string
  sourceType: string | null
  stepOrder: number
}

export interface ConditionPack {
  packType: string
  label: string
  labelEn: string | null
  description: string | null
  descriptionEn: string | null
  templateCount: number
}

export const packsApi = {
  listPacks: () =>
    http.get<{ packs: ConditionPack[] }>('/api/condition-packs'),

  getPackTemplates: (packType: string) =>
    http.get<{ templates: PackTemplate[] }>(`/api/condition-packs/${packType}/templates`),

  applyPack: (offerId: number, packType: string) =>
    http.post<{ loaded: number; conditions: any[] }>(`/api/offers/${offerId}/apply-pack`, { packType }),
}
