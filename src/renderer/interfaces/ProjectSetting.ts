export interface ProjectSetting{
  name: string;
  location: string;
  sourcesDir: string;
  headersDir: string;
  architecture: '8' | '16' | '32';
  build_priority: 'memory' | 'execution';
}
