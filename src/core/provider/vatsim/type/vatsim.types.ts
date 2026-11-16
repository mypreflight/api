export type VatsimAtisEntry = {
  callsign?: string | null;
  atis_code?: string | null;
  text_atis?: string[] | null;
  last_updated?: string | null;
};

export type VatsimDataPayload = {
  atis?: VatsimAtisEntry[] | null;
};
