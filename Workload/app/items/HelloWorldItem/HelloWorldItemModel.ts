export interface HelloWorldItemDefinition  {
  state?: string;
}

export const VIEW_TYPES = {
  EMPTY: 'empty',
  GETTING_STARTED: 'getting-started'
} as const;

export type CurrentView = typeof VIEW_TYPES[keyof typeof VIEW_TYPES];