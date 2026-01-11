export type ISODateString = `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`
export type DateOnlyString = `${number}-${number}-${number}`

// Type Guards für Runtime Validation
export const isISODateString = (value: string): value is ISODateString => {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && 
         !isNaN(Date.parse(value))
}

export const isDateOnlyString = (value: string): value is DateOnlyString => {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && 
         !isNaN(Date.parse(value))
}

export const DateUtils = {
  now: (): ISODateString => new Date().toISOString() as ISODateString,
  
  fromDate: (date: Date): ISODateString => date.toISOString() as ISODateString,
  
  toDate: (isoString: ISODateString): Date => new Date(isoString),
  
  isValid: (dateString: string): boolean => 
    !isNaN(Date.parse(dateString)) && 
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(dateString),
    
  format: (isoString: ISODateString, locale = 'de-DE'): string => 
    new Date(isoString).toLocaleDateString(locale),
    
  // Safe Constructor für ISODateString
  createISODate: (date: Date): ISODateString => {
    const iso = date.toISOString()
    if (!isISODateString(iso)) {
      throw new Error('Invalid date conversion to ISODateString')
    }
    return iso
  },
  
  // Safe Parser
  parseISODate: (value: string): ISODateString | null => {
    return isISODateString(value) ? value : null
  },
} as const