import { toast } from "sonner";

export interface AppError {
  message: string;
  code?: string;
  status?: number;
}

export function handleError(error: unknown): AppError {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as any).code,
      status: (error as any).status,
    };
  }

  if (typeof error === "object" && error !== null) {
    const err = error as any;
    return {
      message: err.message || "Erro desconhecido",
      code: err.code,
      status: err.status,
    };
  }

  return {
    message: "Erro desconhecido",
  };
}

export function showError(error: unknown, customMessage?: string) {
  const appError = handleError(error);
  const message = customMessage || appError.message || "Ocorreu um erro inesperado";
  
  toast.error(message);
  
  if (import.meta.env.DEV) {
    console.error("Error details:", appError);
  }
}

export function showSuccess(message: string) {
  toast.success(message);
}

export function showInfo(message: string) {
  toast.info(message);
}

export function showWarning(message: string) {
  toast.warning(message);
}

