export interface GenerateCodeResponse{
  status: 'success' | 'error';
  error: string;
  data: {
    files: GenerateCodeFile[];
    message: string;
  }
}

export interface GenerateCodeFile{
  type: 'source' | 'header';
  name: string;
  content: string;
}
