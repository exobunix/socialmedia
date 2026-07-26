import { setAuthTokenGetter } from "@workspace/api-client-react";

export const TOKEN_KEY = "socialflow_auth_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Initialize the API client with our token getter
setAuthTokenGetter(getAuthToken);
