import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDnsInstructionsFromVercel,
  getDefaultDnsInstructions,
  getSubdomainPrefix,
  normalizeDnsRecordName,
} from "@/domains/quiz/utils/dns-instructions.utils";

describe("dns-instructions.utils", () => {
  it("returns CNAME with single subdomain label for .com.br", () => {
    assert.equal(getSubdomainPrefix("adquiz.appmind.com.br"), "adquiz");
    assert.deepEqual(getDefaultDnsInstructions("adquiz.appmind.com.br"), [
      {
        type: "CNAME",
        domain: "adquiz",
        value: "cname.vercel-dns.com",
      },
    ]);
  });

  it("returns CNAME for standard .com subdomain", () => {
    assert.equal(getSubdomainPrefix("quiz.empresa.com"), "quiz");
    assert.deepEqual(getDefaultDnsInstructions("quiz.empresa.com"), [
      {
        type: "CNAME",
        domain: "quiz",
        value: "cname.vercel-dns.com",
      },
    ]);
  });

  it("returns A record for apex .com.br", () => {
    assert.equal(getSubdomainPrefix("appmind.com.br"), null);
    assert.deepEqual(getDefaultDnsInstructions("appmind.com.br"), [
      {
        type: "A",
        domain: "@",
        value: "76.76.21.21",
      },
    ]);
  });

  it("returns A record for apex .com", () => {
    assert.equal(getSubdomainPrefix("empresa.com"), null);
    assert.deepEqual(getDefaultDnsInstructions("empresa.com"), [
      {
        type: "A",
        domain: "@",
        value: "76.76.21.21",
      },
    ]);
  });

  it("supports nested subdomain labels", () => {
    assert.equal(getSubdomainPrefix("quiz.loja.empresa.com"), "quiz.loja");
    assert.deepEqual(getDefaultDnsInstructions("quiz.loja.empresa.com"), [
      {
        type: "CNAME",
        domain: "quiz.loja",
        value: "cname.vercel-dns.com",
      },
    ]);
  });

  it("normalizes vercel verification record names for .com.br", () => {
    assert.equal(
      normalizeDnsRecordName("adquiz.appmind.com.br", "_vercel.appmind.com.br"),
      "_vercel",
    );
  });

  it("merges vercel routing and verification records", () => {
    assert.deepEqual(
      buildDnsInstructionsFromVercel({
        hostname: "adquiz.appmind.com.br",
        domainConfig: {
          recommendedCNAME: [
            { rank: 1, value: "afe5fd12795b8822.vercel-dns-017.com." },
          ],
        },
        verification: [
          {
            type: "TXT",
            domain: "_vercel.appmind.com.br",
            value:
              "vc-domain-verify=adquiz.appmind.com.br,e42b59e2e723b0abcdef",
            reason: "Verificação de propriedade do domínio.",
          },
        ],
      }),
      [
        {
          type: "CNAME",
          domain: "adquiz",
          value: "afe5fd12795b8822.vercel-dns-017.com",
        },
        {
          type: "TXT",
          domain: "_vercel",
          value: "vc-domain-verify=adquiz.appmind.com.br,e42b59e2e723b0abcdef",
          reason: "Verificação de propriedade do domínio.",
        },
      ],
    );
  });

  it("falls back to default routing when domain config is unavailable", () => {
    assert.deepEqual(
      buildDnsInstructionsFromVercel({
        hostname: "adquiz.appmind.com.br",
        verification: [
          {
            type: "TXT",
            domain: "_vercel",
            value: "vc-domain-verify=adquiz.appmind.com.br,abc",
          },
        ],
      }),
      [
        {
          type: "CNAME",
          domain: "adquiz",
          value: "cname.vercel-dns.com",
        },
        {
          type: "TXT",
          domain: "_vercel",
          value: "vc-domain-verify=adquiz.appmind.com.br,abc",
        },
      ],
    );
  });
});
