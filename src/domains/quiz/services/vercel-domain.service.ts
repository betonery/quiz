import {
  buildDnsInstructionsFromVercel,
  getDefaultDnsInstructions as buildDefaultDnsInstructions,
  type VercelDomainConfig,
} from "@/domains/quiz/utils/dns-instructions.utils";

const VERCEL_API = "https://api.vercel.com";

export type VercelDomainRecord = {
  type: string;
  domain: string;
  value: string;
  reason?: string;
};

export type VercelDomainResponse = {
  name: string;
  verified: boolean;
  verification?: VercelDomainRecord[];
};

export type VercelDomainConfigResponse = VercelDomainConfig & {
  configuredBy?: string | null;
  misconfigured?: boolean;
};

function getVercelConfig() {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    return null;
  }

  return { token, projectId, teamId };
}

export function isVercelDomainConfigured(): boolean {
  return getVercelConfig() !== null;
}

function buildProjectUrl(path: string): string | null {
  const config = getVercelConfig();
  if (!config) return null;

  const base = `${VERCEL_API}/v10/projects/${config.projectId}${path}`;
  if (!config.teamId) {
    return base;
  }

  return `${base}?teamId=${encodeURIComponent(config.teamId)}`;
}

function buildDomainsUrl(path: string): string | null {
  const config = getVercelConfig();
  if (!config) return null;

  const base = `${VERCEL_API}${path}`;
  if (!config.teamId) {
    return base;
  }

  return `${base}?teamId=${encodeURIComponent(config.teamId)}`;
}

async function vercelFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getVercelConfig();
  const url = buildProjectUrl(path);

  if (!config || !url) {
    throw new Error(
      "Integração com Vercel não configurada. Defina VERCEL_API_TOKEN e VERCEL_PROJECT_ID.",
    );
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Erro na API da Vercel");
  }

  return payload;
}

export async function addProjectDomain(
  hostname: string,
): Promise<VercelDomainResponse> {
  return vercelFetch<VercelDomainResponse>("/domains", {
    method: "POST",
    body: JSON.stringify({ name: hostname }),
  });
}

export async function getProjectDomain(
  hostname: string,
): Promise<VercelDomainResponse> {
  return vercelFetch<VercelDomainResponse>(
    `/domains/${encodeURIComponent(hostname)}`,
  );
}

export async function verifyProjectDomain(
  hostname: string,
): Promise<VercelDomainResponse> {
  return vercelFetch<VercelDomainResponse>(
    `/domains/${encodeURIComponent(hostname)}/verify`,
    { method: "POST" },
  );
}

export async function removeProjectDomain(hostname: string): Promise<void> {
  await vercelFetch<{ error?: { message?: string } }>(
    `/domains/${encodeURIComponent(hostname)}`,
    { method: "DELETE" },
  );
}

export async function getDomainConfiguration(
  hostname: string,
): Promise<VercelDomainConfigResponse | null> {
  const config = getVercelConfig();
  const url = buildDomainsUrl(
    `/v6/domains/${encodeURIComponent(hostname)}/config`,
  );

  if (!config || !url) {
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as VercelDomainConfigResponse;
  } catch {
    return null;
  }
}

export async function resolveProjectDnsInstructions(
  hostname: string,
  vercelResponse: VercelDomainResponse,
): Promise<VercelDomainRecord[]> {
  const domainConfig = await getDomainConfiguration(hostname);

  return buildDnsInstructionsFromVercel({
    hostname,
    verification: vercelResponse.verification,
    domainConfig,
  });
}

export function getDefaultDnsInstructions(
  hostname: string,
): VercelDomainRecord[] {
  return buildDefaultDnsInstructions(hostname);
}
