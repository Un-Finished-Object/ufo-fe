export const patternCategoryLabelMap = {
  apparel: "의류",
  bags: "가방/파우치",
  accessories: "목도리/장갑/모자",
  others: "기타",
} as const;

export const patternSubCategoryLabelMap = {
  outer: "가디건/자켓/볼레로",
  sweater: "스웨터",
  vest: "조끼/민소매/뷔스티에",
  dress: "원피스",
  others: "기타",
} as const;

export const patternCategoryApiMap: Record<string, string> = {
  ALL: "all",
  "의류": "apparel",
  "가방/파우치": "bags",
  "목도리/장갑/모자": "accessories",
  "기타": "others",
};

export const patternSubCategoryApiMap: Record<string, string> = {
  "가디건/자켓/볼레로": "outer",
  "스웨터": "sweater",
  "조끼/민소매/뷔스티에": "vest",
  "원피스": "dress",
  "기타": "others",
};

function mapCategoryLabel<T extends Record<string, string>>(value: string | undefined, labels: T) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  return labels[normalizedValue as keyof T] ?? normalizedValue;
}

export function formatPatternCategory(
  category?: string,
  subCategory?: string,
) {
  const values: string[] = [];
  const mappedCategory = mapCategoryLabel(category, patternCategoryLabelMap);
  const mappedSubCategory = mapCategoryLabel(subCategory, patternSubCategoryLabelMap);

  if (mappedCategory) {
    values.push(mappedCategory);
  }

  if (mappedSubCategory) {
    values.push(mappedSubCategory);
  }

  if (values.length === 0) {
    return "-";
  }

  return values.join(" > ");
}
