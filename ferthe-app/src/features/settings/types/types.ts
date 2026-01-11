export enum LanguageOptions {
  English = 'en',
  German = 'de',
}

export enum ThemeMode {
  Dark = 'dark',
  Light = 'light',
}

export interface Settings {
  theme: ThemeMode
  language: LanguageOptions
}
