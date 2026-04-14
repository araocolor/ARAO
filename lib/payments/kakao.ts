import fs from "node:fs";
import path from "node:path";

const KAKAO_TEST_CID = "TC0ONETIME";
const KAKAO_API_BASE = "https://open-api.kakaopay.com/online/v1/payment";

type KakaoReadyPayload = {
  partnerOrderId: string;
  partnerUserId: string;
  itemName: string;
  totalAmount: number;
  approvalUrl: string;
  cancelUrl: string;
  failUrl: string;
};

type KakaoReadyResponse = {
  tid: string;
  next_redirect_app_url?: string;
  next_redirect_mobile_url?: string;
  next_redirect_pc_url?: string;
  android_app_scheme?: string;
  ios_app_scheme?: string;
  created_at?: string;
};

type KakaoApprovePayload = {
  tid: string;
  partnerOrderId: string;
  partnerUserId: string;
  pgToken: string;
};

type KakaoApproveResponse = {
  aid?: string;
  tid: string;
  approved_at?: string;
  amount?: {
    total?: number;
  };
};

let cachedLegacyEnv: Map<string, string> | null = null;

function readLegacyEnvFile(): Map<string, string> {
  if (cachedLegacyEnv) {
    return cachedLegacyEnv;
  }

  const envMap = new Map<string, string>();
  const envPath = path.join(process.cwd(), ".env.local");

  try {
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
      if (key) {
        envMap.set(key, value);
      }
    }
  } catch {
    // ignore missing local env file in non-local environments
  }

  cachedLegacyEnv = envMap;
  return envMap;
}

function getEnvValue(keys: string[]): string | null {
  for (const key of keys) {
    const direct = process.env[key];
    if (direct) {
      return direct;
    }
  }

  const legacyEnv = readLegacyEnvFile();
  for (const key of keys) {
    const legacy = legacyEnv.get(key);
    if (legacy) {
      return legacy;
    }
  }

  return null;
}

function getSecretKey(): string {
  const secretKey = getEnvValue([
    "KAKAO_PAY_SECRET_KEY_DEV",
    "KAKAO_PAY_SECRET_KEY",
    "Secret key(dev)",
    "Secret key",
  ]);

  if (!secretKey) {
    throw new Error("카카오페이 시크릿 키를 찾을 수 없습니다.");
  }

  return secretKey;
}

function getAuthHeader(): string {
  const secretKey = getSecretKey();
  return secretKey.startsWith("DEV") || secretKey.startsWith("PROD")
    ? `SECRET_KEY ${secretKey}`
    : `DEV_SECRET_KEY ${secretKey}`;
}

async function kakaoRequest<T>(pathName: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${KAKAO_API_BASE}${pathName}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as { error_message?: string } | T | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error_message" in payload && payload.error_message
        ? payload.error_message
        : "카카오페이 요청에 실패했습니다.";
    throw new Error(message);
  }

  return payload as T;
}

export function getKakaoTestCid() {
  return getEnvValue(["KAKAO_PAY_CID", "KAKAO_PAY_TEST_CID"]) ?? KAKAO_TEST_CID;
}

export async function requestKakaoReady(payload: KakaoReadyPayload): Promise<KakaoReadyResponse> {
  const vatAmount = Math.floor(payload.totalAmount / 11);

  return kakaoRequest<KakaoReadyResponse>("/ready", {
    cid: getKakaoTestCid(),
    partner_order_id: payload.partnerOrderId,
    partner_user_id: payload.partnerUserId,
    item_name: payload.itemName,
    quantity: 1,
    total_amount: payload.totalAmount,
    vat_amount: vatAmount,
    tax_free_amount: 0,
    approval_url: payload.approvalUrl,
    cancel_url: payload.cancelUrl,
    fail_url: payload.failUrl,
  });
}

export async function requestKakaoApprove(payload: KakaoApprovePayload): Promise<KakaoApproveResponse> {
  return kakaoRequest<KakaoApproveResponse>("/approve", {
    cid: getKakaoTestCid(),
    tid: payload.tid,
    partner_order_id: payload.partnerOrderId,
    partner_user_id: payload.partnerUserId,
    pg_token: payload.pgToken,
  });
}
