const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const UINT32 = 0x100000000;

export function stableSeed(key: string): number {
  let hash = FNV_OFFSET;

  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }

  return hash;
}

export function stableUnit(key: string): number {
  return stableSeed(key) / UINT32;
}
