export enum LanguageOptions {
  English = 'en',
  German = 'de',
}

export enum ThemeMode {
  Dark = 'dark',
  Light = 'light',
}

export interface AppFlags {
  hasSeenOnboarding: boolean
  // add more flags here as needed
}

export interface Settings {
  theme: ThemeMode
  language: LanguageOptions
  flags: AppFlags
}
