export function createSlug(name: string): string {
  // Generate a random 4-digit number for uniqueness
  const randomCode = Math.floor(1000 + Math.random() * 9000)
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

  return `${baseSlug}-${randomCode}`
}
