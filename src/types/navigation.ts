export type AppPage =
  | 'dashboard'
  | 'debts'
  | 'catalog'
  | 'stock-in'
  | 'stock-out'
  | 'history'
  | 'history-in'
  | 'history-out'
  | 'reports';

export interface PageMeta {
  title: string;
  subtitle: string;
}
