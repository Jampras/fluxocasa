export async function requestJson<TResponse>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const data = (await response.json().catch(() => ({}))) as TResponse & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message || "Nao foi possivel concluir a operacao.");
  }

  return data;
}

