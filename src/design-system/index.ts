// Root design-system barrel.
// Import from the specific tier barrel for finer control; this root barrel is
// for convenience consumers that don't care about tier boundaries.
//
// Collision resolution: Combobox lives in molecules only (atoms/Combobox is a
// backward-compat shim and is excluded from the atoms barrel to avoid duplication).

export * from "./ui";
export * from "./atoms";
export * from "./molecules";
export * from "./organisms";
