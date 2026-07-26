import { formatPatternCategory } from "@/features/patterns/lib/patternCategories";
import {
  createInvalidApiResponseError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";

type OriginalYarnResponse = {
  yarnId?: number | null;
  yarnName?: string | null;
  ply?: number | null;
  weight?: number | null;
  cost?: number | null;
  component?: string | null;
  store?: string | null;
  length?: number | null;
  isCalculatedLength?: boolean | null;
};

type OriginalYarnSetResponse = {
  originalYarnSetId?: number;
  firstYarn?: OriginalYarnResponse | null;
  secondYarn?: OriginalYarnResponse | null;
  subYarn?: OriginalYarnResponse | null;
};

export type PatternDetailResponse = {
  data?: {
    id?: number;
    title?: string;
    images?: string[];
    author?: string;
    stats?: {
      views?: number;
      scraps?: number;
    };
    my?: {
      scrapped?: boolean;
    };
    meta?: {
      category?: string;
      subCategory?: string;
      gauge?: string;
      originalYarn?: OriginalYarnSetResponse[];
      originalNeedle?: string;
      requiredYarnAmount?: string;
      size?: string;
      actualSize?: string;
    };
  };
  error?: unknown;
};

export type OriginalYarn = {
  yarnId: number;
  yarnName: string;
  ply: number | null;
  weight: number | null;
  cost: number | null;
  component: string;
  store: string;
  length: number | null;
  isCalculatedLength: boolean | null;
};

export type OriginalYarnSet = {
  originalYarnSetId: number | null;
  firstYarn: OriginalYarn;
  secondYarn: OriginalYarn | null;
  subYarn: OriginalYarn | null;
};

export type PatternDetailData = {
  id: number;
  title: string;
  author: string;
  categoryCode: string;
  credits: number;
  image: string;
  isScrapped: boolean;
  originalYarnSets: OriginalYarnSet[];
  stats: {
    views: number;
    scraps: number;
  };
  details: {
    category: string;
    size: string;
    measurement: string;
    needle: string;
    amount: string;
    gauge: string;
  };
};

function getSafeText(value?: string | null) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : "-";
}

function getOptionalText(value?: string | null) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : "";
}

function normalizeOriginalYarn(
  yarn?: OriginalYarnResponse | null,
): OriginalYarn | null {
  if (!yarn || typeof yarn.yarnId !== "number") {
    return null;
  }

  const length = typeof yarn.length === "number" ? yarn.length : null;

  return {
    yarnId: yarn.yarnId,
    yarnName: getOptionalText(yarn.yarnName),
    ply: typeof yarn.ply === "number" ? yarn.ply : null,
    weight: typeof yarn.weight === "number" ? yarn.weight : null,
    cost: typeof yarn.cost === "number" ? yarn.cost : null,
    component: getOptionalText(yarn.component),
    store: getOptionalText(yarn.store),
    length,
    isCalculatedLength:
      length !== null && typeof yarn.isCalculatedLength === "boolean"
        ? yarn.isCalculatedLength
        : null,
  };
}

function normalizeOriginalYarnSets(
  originalYarn?: OriginalYarnSetResponse[],
): OriginalYarnSet[] {
  if (!Array.isArray(originalYarn)) {
    return [];
  }

  return originalYarn.reduce<OriginalYarnSet[]>((normalizedSets, yarnSet) => {
    const firstYarn = normalizeOriginalYarn(yarnSet.firstYarn);

    if (!firstYarn) {
      return normalizedSets;
    }

    normalizedSets.push({
      originalYarnSetId:
        typeof yarnSet.originalYarnSetId === "number"
          ? yarnSet.originalYarnSetId
          : null,
      firstYarn,
      secondYarn: normalizeOriginalYarn(yarnSet.secondYarn),
      subYarn: normalizeOriginalYarn(yarnSet.subYarn),
    });

    return normalizedSets;
  }, []);
}

export function normalizePatternDetailResponse(
  payload: PatternDetailResponse,
): PatternDetailData {
  if (
    !payload.data ||
    typeof payload.data.id !== "number" ||
    typeof payload.data.title !== "string"
  ) {
    if (payload.error) {
      throwApiPayloadError(payload.error, "Failed to load pattern detail.");
    }

    throw createInvalidApiResponseError("Invalid pattern detail response.");
  }

  const originalYarnSets = normalizeOriginalYarnSets(payload.data.meta?.originalYarn);

  return {
    id: payload.data.id,
    title: payload.data.title,
    author: getSafeText(payload.data.author),
    categoryCode: getOptionalText(payload.data.meta?.category),
    image: payload.data.images?.[0] || "/image/UFO.svg",
    isScrapped: Boolean(payload.data.my?.scrapped),
    credits: 20,
    originalYarnSets,
    stats: {
      views: payload.data.stats?.views ?? 0,
      scraps: payload.data.stats?.scraps ?? 0,
    },
    details: {
      category: formatPatternCategory(
        payload.data.meta?.category,
        payload.data.meta?.subCategory,
      ),
      size: getSafeText(payload.data.meta?.size),
      measurement: getSafeText(payload.data.meta?.actualSize),
      needle: getSafeText(payload.data.meta?.originalNeedle),
      amount: getSafeText(payload.data.meta?.requiredYarnAmount),
      gauge: getSafeText(payload.data.meta?.gauge),
    },
  };
}
