export type DnsInstructionRecord = {
  type: string;
  domain: string;
  value: string;
  reason?: string;
};

export type VercelDomainConfig = {
  recommendedCNAME?: Array<{ rank: number; value: string }>;
  recommendedIPv4?: Array<{ rank: number; value: string[] }>;
};

export type VercelVerificationRecord = {
  type: string;
  domain: string;
  value: string;
  reason?: string;
};

/** Sufixos públicos compostos comuns (ex.: .com.br exige 3 labels no domínio registrável). */
const COMPOUND_PUBLIC_SUFFIXES = new Set([
  "com.br",
  "org.br",
  "net.br",
  "gov.br",
  "edu.br",
  "mil.br",
  "art.br",
  "blog.br",
  "dev.br",
  "co.uk",
  "org.uk",
  "ac.uk",
  "com.au",
  "co.nz",
  "com.mx",
]);

export function getRegistrableDomainLabelCount(hostname: string): number {
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length <= 1) {
    return parts.length;
  }

  const lastTwo =
    `${parts[parts.length - 2]}.${parts[parts.length - 1]}`.toLowerCase();

  if (COMPOUND_PUBLIC_SUFFIXES.has(lastTwo)) {
    return 3;
  }

  return 2;
}

export function getRegistrableDomain(hostname: string): string {
  const parts = hostname.split(".").filter(Boolean);
  const count = getRegistrableDomainLabelCount(hostname);
  return parts.slice(-count).join(".");
}

export function getSubdomainPrefix(hostname: string): string | null {
  const parts = hostname.split(".").filter(Boolean);
  const registrableCount = getRegistrableDomainLabelCount(hostname);

  if (parts.length <= registrableCount) {
    return null;
  }

  return parts.slice(0, parts.length - registrableCount).join(".");
}

export function normalizeDnsRecordName(
  hostname: string,
  recordDomain: string,
): string {
  const normalized = recordDomain.toLowerCase().trim().replace(/\.$/, "");
  const host = hostname.toLowerCase().trim();
  const registrableDomain = getRegistrableDomain(host);

  if (normalized === host || normalized === registrableDomain) {
    return "@";
  }

  if (normalized.endsWith(`.${registrableDomain}`)) {
    const relative = normalized.slice(0, -(registrableDomain.length + 1));
    return relative || "@";
  }

  return normalized;
}

function pickBestRanked<T extends { rank: number }>(
  items: T[] | undefined,
): T | undefined {
  if (!items?.length) {
    return undefined;
  }

  return [...items].sort((a, b) => a.rank - b.rank)[0];
}

function stripTrailingDot(value: string): string {
  return value.replace(/\.$/, "");
}

function buildRoutingRecords(
  hostname: string,
  domainConfig?: VercelDomainConfig | null,
): DnsInstructionRecord[] {
  const subdomainPrefix = getSubdomainPrefix(hostname);

  if (subdomainPrefix) {
    const cname = pickBestRanked(domainConfig?.recommendedCNAME);
    if (cname?.value) {
      return [
        {
          type: "CNAME",
          domain: subdomainPrefix,
          value: stripTrailingDot(cname.value),
        },
      ];
    }

    return getDefaultDnsInstructions(hostname);
  }

  const ipv4 = pickBestRanked(domainConfig?.recommendedIPv4);
  const ip = ipv4?.value?.[0];
  if (ip) {
    return [{ type: "A", domain: "@", value: ip }];
  }

  return getDefaultDnsInstructions(hostname);
}

function dedupeRecords(
  records: DnsInstructionRecord[],
): DnsInstructionRecord[] {
  const seen = new Set<string>();

  return records.filter((record) => {
    const key = `${record.type}:${record.domain}:${record.value}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function buildDnsInstructionsFromVercel(params: {
  hostname: string;
  verification?: VercelVerificationRecord[];
  domainConfig?: VercelDomainConfig | null;
}): DnsInstructionRecord[] {
  const { hostname, verification, domainConfig } = params;
  const routing = buildRoutingRecords(hostname, domainConfig);

  const verificationRecords = (verification ?? []).map((record) => {
    const mapped: DnsInstructionRecord = {
      type: record.type.toUpperCase(),
      domain: normalizeDnsRecordName(hostname, record.domain),
      value: stripTrailingDot(record.value),
    };

    if (record.reason) {
      mapped.reason = record.reason;
    }

    return mapped;
  });

  return dedupeRecords([...routing, ...verificationRecords]);
}

export function getDefaultDnsInstructions(
  hostname: string,
): DnsInstructionRecord[] {
  const normalized = hostname.toLowerCase().trim();
  const subdomainPrefix = getSubdomainPrefix(normalized);

  if (subdomainPrefix) {
    return [
      {
        type: "CNAME",
        domain: subdomainPrefix,
        value: "cname.vercel-dns.com",
      },
    ];
  }

  return [
    {
      type: "A",
      domain: "@",
      value: "76.76.21.21",
    },
  ];
}
