export interface StatementBlock{
  id: number;
  name: string;
  statements: string;
  execution: {
    en: boolean;
    du: boolean;
    ex: boolean;
  };
}
