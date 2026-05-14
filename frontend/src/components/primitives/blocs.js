export const BLOCS = {
  CN: {
    name: "China",
    code: "CN",
    color: "var(--bloc-cn)",
    region: "East Asia",
  },
  RU: {
    name: "Russia",
    code: "RU",
    color: "var(--bloc-ru)",
    region: "Eurasia",
  },
  ME: {
    name: "Middle East",
    code: "ME",
    color: "var(--bloc-me)",
    region: "MENA",
  },
  EU: {
    name: "Europe",
    code: "EU",
    color: "var(--bloc-eu)",
    region: "European Union",
  },
  WS: {
    name: "Wire Services",
    code: "WS",
    color: "var(--bloc-ws)",
    region: "Reuters / AP / AFP",
  },
  US: {
    name: "US / Western",
    code: "US",
    color: "var(--bloc-us)",
    region: "North America",
  },
  IN: {
    name: "India",
    code: "IN",
    color: "var(--bloc-in)",
    region: "South Asia",
  },
  GS: {
    name: "Global South",
    code: "GS",
    color: "var(--bloc-gs)",
    region: "Africa / LatAm",
  },
};

export const REGION_TO_CODE = {
  China: "CN",
  Russia: "RU",
  "Middle East": "ME",
  Europe: "EU",
  "Wire Services": "WS",
  "US/Western": "US",
  India: "IN",
  "Global South": "GS",
};

export function blocFromRegion(regionName) {
  const code = REGION_TO_CODE[regionName];
  return code ? BLOCS[code] : null;
}
