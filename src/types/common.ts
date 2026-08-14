export interface ApiErrorResponse {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}
