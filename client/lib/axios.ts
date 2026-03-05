import { toast } from "sonner";
import axios from "axios";

let authTokenProvider: (() => Promise<string | null>) | null = null;

export function setAuthTokenProvider(provider: () => Promise<string | null>) {
  authTokenProvider = provider;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(async (config) => {
  if (authTokenProvider) {
    const token = await authTokenProvider();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== "undefined") {
      let message = "An unexpected error occurred";
      const dataError = err.response?.data?.error;

      if (typeof dataError === "string") {
        message = dataError;
      } else if (dataError?.formErrors?.length > 0) {
        message = dataError.formErrors[0];
      } else if (
        dataError?.fieldErrors &&
        Object.keys(dataError.fieldErrors).length > 0
      ) {
        const firstField = Object.keys(dataError.fieldErrors)[0];
        message = `${firstField}: ${dataError.fieldErrors[firstField][0]}`;
      } else if (err.message) {
        message = err.message;
      }

      toast.error("Error", {
        description: message,
      });
    }
    return Promise.reject(err);
  },
);

export default api;
