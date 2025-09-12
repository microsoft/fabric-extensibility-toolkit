export interface ExcelEmbedItemDefinition {
  embedCode?: string;
  title?: string;
}

export const VIEW_TYPES = {
  EMPTY: 'empty',
  CONFIGURED: 'configured'
} as const;

export type CurrentView = typeof VIEW_TYPES[keyof typeof VIEW_TYPES];