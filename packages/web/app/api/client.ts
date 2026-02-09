async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  return response.json();
}

async function handleTextResponse(response: Response): Promise<string> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  return response.text();
}

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    return handleResponse<T>(response);
  },

  async getText(url: string): Promise<string> {
    const response = await fetch(url);
    return handleTextResponse(response);
  },

  async post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },
};
