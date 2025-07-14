import {
  getDestinyManifest,
  getDestinyManifestSlice,
  getDestinyEntityDefinition,
  type HttpClientConfig,
} from "bungie-api-ts/destiny2";
import { writeFile, mkdir, access, readFile } from "fs/promises";
import path from "path";
import type {
  DestinyItem,
  DestinyManifest as DestinyManifestData,
} from "../types/destinyItem";
import { distance } from "fastest-levenshtein";
import {
  mapD2ItemType,
  mapD2ItemSubType,
  mapD2DamageType,
  mapD2AmmoType,
} from "./utils";

type DestinyLanguage =
  | "en"
  | "de"
  | "es"
  | "es-mx"
  | "fr"
  | "it"
  | "ja"
  | "ko"
  | "pl"
  | "pt-br"
  | "ru"
  | "zh-chs"
  | "zh-cht";

export class DestinyAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string
  ) {
    super(message);
    this.name = "DestinyAPIError";
  }
}

export class DestinyManifestError extends Error {
  constructor(message: string, public override cause?: Error) {
    super(message);
    this.name = "DestinyManifestError";
  }
}

async function $http(config: HttpClientConfig): Promise<any> {
  const apiKey = process.env.BUNGIE_API_KEY;

  if (!apiKey) {
    throw new DestinyAPIError("BUNGIE_API_KEY environment variable is not set");
  }

  if (!config.url) {
    throw new DestinyAPIError("Request URL is required");
  }

  try {
    const response = await fetch(config.url, {
      headers: {
        "X-API-Key": apiKey,
        "User-Agent": "quantum-spewer/1.0.0",
      },
    });

    if (!response.ok) {
      throw new DestinyAPIError(
        `API request failed: ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    const data = await response.json();

    // Check for Bungie API error response format
    if (
      typeof data === "object" &&
      data !== null &&
      "ErrorCode" in data &&
      data.ErrorCode !== 1
    ) {
      const errorData = data as any;
      throw new DestinyAPIError(
        `Bungie API Error: ${errorData.Message || "Unknown error"}`,
        errorData.ErrorCode as number,
        errorData.ErrorStatus as string
      );
    }

    return data;
  } catch (error) {
    if (error instanceof DestinyAPIError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new DestinyAPIError(
        "Network error: Unable to reach Bungie API",
        undefined,
        "NETWORK_ERROR"
      );
    }

    throw new DestinyAPIError(
      `Unexpected error during API request: ${
        error instanceof Error ? error.message : String(error)
      }`,
      undefined,
      "UNKNOWN_ERROR"
    );
  }
}

class DestinyManifest {
  private manifest: any;
  private manifestPath: string;
  private manifestExpiry: Date | null = null;
  private readonly MANIFEST_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor(manifestPath = path.resolve("data/destiny_manifest.json")) {
    this.manifestPath = manifestPath;
  }

  private async ensureDirectoryExists(filePath: string): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      await mkdir(dir, { recursive: true });
    } catch (error) {
      throw new DestinyManifestError(
        `Failed to create directory for manifest: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private isManifestExpired(): boolean {
    if (!this.manifestExpiry) return true;
    return Date.now() > this.manifestExpiry.getTime();
  }

  private transformToDestinyItem(itemHash: string, rawItem: any): DestinyItem {
    return {
      hash: parseInt(itemHash, 10),
      displayProperties: {
        name: rawItem.displayProperties?.name || "",
        description: rawItem.displayProperties?.description || "",
        icon: rawItem.displayProperties?.icon,
        hasIcon: rawItem.displayProperties?.hasIcon || false,
      },
      flavorText: rawItem.flavorText || "",
      itemTypeDisplayName: rawItem.itemTypeDisplayName || "",
      itemTypeAndTierDisplayName: rawItem.itemTypeAndTierDisplayName || "",
      inventory: {
        maxStackSize: rawItem.inventory?.maxStackSize || 1,
        tierTypeName: rawItem.inventory?.tierTypeName || "",
        tierType: rawItem.inventory?.tierType || 0,
      },
      equippingBlock: rawItem.equippingBlock
        ? {
            ammoType: rawItem.equippingBlock.ammoType || 0,
          }
        : undefined,
      itemCategoryHashes: rawItem.itemCategoryHashes || [],
      itemType: rawItem.itemType || 0,
      itemSubType: rawItem.itemSubType || 0,
      classType: rawItem.classType || 3,
      equippable: rawItem.equippable || false,
      defaultDamageType: rawItem.defaultDamageType || 0,
      redacted: rawItem.redacted || false,
      blacklisted: rawItem.blacklisted || false,
      investmentStats: rawItem.investmentStats || undefined,
      perks: rawItem.perks || undefined,
    };
  }

  private async fetchManifest(): Promise<any> {
    try {
      if (this.manifest && !this.isManifestExpired()) {
        return this.manifest;
      }

      const destinyManifest = await getDestinyManifest($http);

      if (!destinyManifest || !destinyManifest.Response) {
        throw new DestinyManifestError(
          "Invalid manifest response from Bungie API"
        );
      }

      this.manifest = destinyManifest.Response;
      this.manifestExpiry = new Date(Date.now() + this.MANIFEST_CACHE_DURATION);

      return this.manifest;
    } catch (error) {
      if (
        error instanceof DestinyAPIError ||
        error instanceof DestinyManifestError
      ) {
        throw error;
      }

      throw new DestinyManifestError(
        `Failed to fetch destiny manifest: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private async fetchTable<
    T extends keyof import("bungie-api-ts/destiny2").AllDestinyManifestComponents
  >(tableName: T, language: DestinyLanguage = "en"): Promise<any> {
    try {
      if (!tableName) {
        throw new DestinyManifestError("Table name is required");
      }

      if (!this.manifest) {
        await this.fetchManifest();
      }

      const manifestTables = await getDestinyManifestSlice($http, {
        destinyManifest: this.manifest,
        tableNames: [tableName],
        language,
      });

      if (!manifestTables || !manifestTables[tableName]) {
        throw new DestinyManifestError(
          `Table '${String(tableName)}' not found in manifest`
        );
      }

      return manifestTables[tableName];
    } catch (error) {
      if (
        error instanceof DestinyAPIError ||
        error instanceof DestinyManifestError
      ) {
        throw error;
      }

      throw new DestinyManifestError(
        `Failed to fetch table '${String(tableName)}': ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private async saveTableLocally<
    T extends keyof import("bungie-api-ts/destiny2").AllDestinyManifestComponents
  >(tableName: T, language: DestinyLanguage = "en"): Promise<string> {
    try {
      if (!tableName) {
        throw new DestinyManifestError("Table name is required");
      }

      await this.ensureDirectoryExists(this.manifestPath);

      const table = await this.fetchTable(tableName, language);

      if (!table) {
        throw new DestinyManifestError(
          `No data received for table '${String(tableName)}'`
        );
      }

      // Transform the data to only include properties we need
      let dataToSave: any;

      if (tableName === "DestinyInventoryItemDefinition") {
        const transformedData: DestinyManifestData = {};

        for (const [itemHash, rawItem] of Object.entries(table)) {
          // Filter out items that don't have flavor text
          if (
            rawItem &&
            typeof rawItem === "object" &&
            "flavorText" in rawItem &&
            rawItem.flavorText &&
            typeof rawItem.flavorText === "string" &&
            rawItem.flavorText.trim() !== ""
          ) {
            transformedData[itemHash] = this.transformToDestinyItem(
              itemHash,
              rawItem
            );
          }
        }

        dataToSave = transformedData;
      } else {
        // For other tables, save as-is
        dataToSave = table;
      }

      await writeFile(
        this.manifestPath,
        JSON.stringify(dataToSave, null, 2),
        "utf8"
      );

      // Verify the file was written successfully
      try {
        await access(this.manifestPath);
      } catch {
        throw new DestinyManifestError(
          "Failed to verify manifest file was written successfully"
        );
      }

      return this.manifestPath;
    } catch (error) {
      if (
        error instanceof DestinyAPIError ||
        error instanceof DestinyManifestError
      ) {
        throw error;
      }

      throw new DestinyManifestError(
        `Failed to save table '${String(tableName)}' locally: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  // Public methods with enhanced error handling and validation

  /**
   * Gets a table from the Destiny manifest
   * @param tableName - The name of the table to retrieve
   * @param language - The language for the manifest (defaults to "en")
   * @returns Promise resolving to the table data
   */
  public async getTable<
    T extends keyof import("bungie-api-ts/destiny2").AllDestinyManifestComponents
  >(tableName: T, language: DestinyLanguage = "en"): Promise<any> {
    return this.fetchTable(tableName, language);
  }

  /**
   * Gets ItemDefs from the Destiny manifest
   * @param language - The language for the manifest (defaults to "en")
   * @returns Promise resolving to the ItemDefs data
   */
  public async getItemDefs(language: DestinyLanguage = "en"): Promise<any> {
    return this.fetchTable("DestinyInventoryItemDefinition", language);
  }

  /**
   * Downloads and saves ItemDefs locally
   * @param language - The language for the manifest (defaults to "en")
   * @returns Promise resolving to the file path where ItemDefs were saved
   */
  public async downloadItemDefs(
    language: DestinyLanguage = "en"
  ): Promise<string> {
    return this.saveTableLocally("DestinyInventoryItemDefinition", language);
  }

  /**
   * Forces a refresh of the manifest cache
   */
  public async refreshManifest(): Promise<void> {
    this.manifest = null;
    this.manifestExpiry = null;
    await this.fetchManifest();
  }

  /**
   * Checks if the manifest cache is still valid
   */
  public isManifestCacheValid(): boolean {
    return this.manifest !== null && !this.isManifestExpired();
  }

  /**
   * Gets the current manifest cache expiry date
   */
  public getManifestExpiry(): Date | null {
    return this.manifestExpiry;
  }

  /**
   * Gets transformed ItemDefs from local file, or downloads and creates it if it doesn't exist
   * @param language - The language for the manifest (defaults to "en")
   * @returns Promise resolving to the transformed ItemDefs JSON data
   */
  public async getTransformedItemDefs(
    language: DestinyLanguage = "en"
  ): Promise<DestinyManifestData> {
    try {
      // First, try to load from local file
      try {
        await access(this.manifestPath);
        const fileContent = await readFile(this.manifestPath, "utf8");
        const parsedData = JSON.parse(fileContent);

        // Validate that the data is not empty
        if (parsedData && Object.keys(parsedData).length > 0) {
          return parsedData as DestinyManifestData;
        }
      } catch (error) {
        // File doesn't exist or is invalid, we'll create it below
      }

      // If file doesn't exist or is invalid, download and save locally
      await this.downloadItemDefs(language);

      // Now read the newly created file
      const fileContent = await readFile(this.manifestPath, "utf8");
      return JSON.parse(fileContent) as DestinyManifestData;
    } catch (error) {
      if (
        error instanceof DestinyAPIError ||
        error instanceof DestinyManifestError
      ) {
        throw error;
      }

      throw new DestinyManifestError(
        `Failed to get transformed ItemDefs: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }
}

interface FindItemOptions {
  maxResults?: number;
  searchInFlavor?: boolean;
  fuzzyThreshold?: number;
  exactMatchOnly?: boolean;
}

interface DestinyItemWithMappings extends DestinyItem {
  mappings: {
    itemType: string;
    itemSubType: string;
    damageType: string;
    ammoType?: string;
    classType: string;
  };
}

class DestinyItemFinder {
  private manifest: DestinyManifest;
  private itemDefs: DestinyManifestData | null = null;

  constructor(manifest?: DestinyManifest) {
    this.manifest = manifest || new DestinyManifest();
  }

  private async loadItemDefs() {
    if (!this.itemDefs) {
      this.itemDefs = await this.manifest.getTransformedItemDefs();
    }
  }

  /**
   * Fuzzy finds an item by searching item names first, then flavor text
   * @param searchTerm - The term to search for
   * @param options - Search options
   * @returns Array of up to maxResults best matching DestinyItems, ordered by relevance
   */
  private async fuzzyFindItem(
    searchTerm: string,
    options: Omit<FindItemOptions, "exactMatchOnly"> = {}
  ): Promise<DestinyItem[]> {
    const {
      maxResults = 3,
      searchInFlavor = true,
      fuzzyThreshold = 0.5,
    } = options;
    await this.loadItemDefs();
    if (!this.itemDefs) {
      throw new DestinyManifestError("Item definitions not loaded");
    }

    const items = Object.values(this.itemDefs);
    const searchTermLower = searchTerm.toLowerCase();
    const results: Array<{ item: DestinyItem; score: number; type: string }> =
      [];

    // Find partial matches in item names
    const partialNameMatches = items.filter((item) =>
      item.displayProperties.name.toLowerCase().includes(searchTermLower)
    );
    partialNameMatches.forEach((item) => {
      // Score based on how much of the name is the search term
      const score = searchTermLower.length / item.displayProperties.name.length;
      results.push({ item, score, type: "partial_name" });
    });

    // Try fuzzy matching on item names
    const itemNamesWithItems = items.map((item) => ({
      item,
      name: item.displayProperties.name,
    }));

    itemNamesWithItems.forEach(({ item, name }) => {
      const nameDistance = distance(searchTerm, name);
      const maxDistance = Math.floor(searchTerm.length * fuzzyThreshold);

      if (nameDistance <= maxDistance && nameDistance > 0) {
        // Convert distance to score (lower distance = higher score)
        const score = 1 - nameDistance / searchTerm.length;
        results.push({ item, score, type: "fuzzy_name" });
      }
    });

    // Optionally search in flavor text
    if (searchInFlavor) {
      items.forEach((item) => {
        const flavorDistance = distance(searchTerm, item.flavorText);
        const maxDistance = Math.floor(
          searchTerm.length * (fuzzyThreshold + 0.2)
        );

        if (flavorDistance <= maxDistance && flavorDistance > 0) {
          // Convert distance to score (lower distance = higher score)
          const score = 0.5 * (1 - flavorDistance / searchTerm.length); // Lower base score for flavor text
          results.push({ item, score, type: "fuzzy_flavor" });
        }
      });
    }

    // Remove duplicates (prefer higher priority matches)
    const uniqueResults = new Map<
      number,
      { item: DestinyItem; score: number; type: string }
    >();

    // Sort by type priority and score
    const typePriority = {
      partial_name: 0,
      fuzzy_name: 1,
      fuzzy_flavor: 2,
    };
    results.sort((a, b) => {
      const typeDiff =
        typePriority[a.type as keyof typeof typePriority] -
        typePriority[b.type as keyof typeof typePriority];
      if (typeDiff !== 0) return typeDiff;
      return b.score - a.score; // Higher score first
    });

    // Keep only unique items (by hash), preferring the first occurrence
    results.forEach((result) => {
      if (!uniqueResults.has(result.item.hash)) {
        uniqueResults.set(result.item.hash, result);
      }
    });

    // Return top maxResults results
    return Array.from(uniqueResults.values())
      .sort((a, b) => {
        const typeDiff =
          typePriority[a.type as keyof typeof typePriority] -
          typePriority[b.type as keyof typeof typePriority];
        if (typeDiff !== 0) return typeDiff;
        return b.score - a.score;
      })
      .slice(0, maxResults)
      .map((result) => result.item);
  }

  /**
   * Finds an item by exact name match first, then falls back to fuzzy matching
   * @param searchTerm - The term to search for
   * @param options - Search options
   * @returns Array of matching DestinyItems, with exact matches first
   */
  public async findItem(
    searchTerm: string,
    options: FindItemOptions = {}
  ): Promise<DestinyItem[]> {
    const {
      maxResults = 3,
      searchInFlavor = true,
      fuzzyThreshold = 0.5,
      exactMatchOnly = false,
    } = options;

    await this.loadItemDefs();
    if (!this.itemDefs) {
      throw new DestinyManifestError("Item definitions not loaded");
    }

    const items = Object.values(this.itemDefs);
    const searchTermLower = searchTerm.toLowerCase();

    // First, try exact match in display name
    const exactMatch = items.find(
      (item) => item.displayProperties.name.toLowerCase() === searchTermLower
    );

    if (exactMatch) {
      return [exactMatch];
    }

    // If exact match only is requested, return empty array
    if (exactMatchOnly) {
      return [];
    }

    // Fall back to fuzzy matching
    return this.fuzzyFindItem(searchTerm, {
      maxResults,
      searchInFlavor,
      fuzzyThreshold,
    });
  }

  private applyMappingsToItem(item: DestinyItem): DestinyItemWithMappings {
    const classTypeMapping = (classType: number): string => {
      switch (classType) {
        case 0:
          return "Titan";
        case 1:
          return "Hunter";
        case 2:
          return "Warlock";
        case 3:
          return "Any Class";
        default:
          return `Unknown (${classType})`;
      }
    };

    return {
      ...item,
      mappings: {
        itemType: mapD2ItemType(item.itemType),
        itemSubType: mapD2ItemSubType(item.itemSubType),
        damageType: mapD2DamageType(item.defaultDamageType),
        ammoType: item.equippingBlock?.ammoType
          ? mapD2AmmoType(item.equippingBlock.ammoType)
          : undefined,
        classType: classTypeMapping(item.classType),
      },
    };
  }

  public async getItemDetails(
    itemHash: number
  ): Promise<DestinyItemWithMappings | null> {
    await this.loadItemDefs();
    if (!this.itemDefs) {
      throw new DestinyManifestError("Item definitions not loaded");
    }
    if (!itemHash) {
      throw new DestinyManifestError("Item hash is required");
    }

    try {
      const response = await getDestinyEntityDefinition($http, {
        entityType: "DestinyInventoryItemDefinition",
        hashIdentifier: itemHash,
      });

      if (!response || !response.Response) {
        return null;
      }

      const rawItem = response.Response as any; // Cast to any to access all properties

      // Transform the raw API response to our DestinyItem type
      const destinyItem: DestinyItem = {
        hash: itemHash,
        displayProperties: {
          name: rawItem.displayProperties?.name || "",
          description: rawItem.displayProperties?.description || "",
          icon: rawItem.displayProperties?.icon,
          hasIcon: rawItem.displayProperties?.hasIcon || false,
        },
        flavorText: rawItem.flavorText || "",
        itemTypeDisplayName: rawItem.itemTypeDisplayName || "",
        itemTypeAndTierDisplayName: rawItem.itemTypeAndTierDisplayName || "",
        inventory: {
          maxStackSize: rawItem.inventory?.maxStackSize || 1,
          tierTypeName: rawItem.inventory?.tierTypeName || "",
          tierType: rawItem.inventory?.tierType || 0,
        },
        equippingBlock: rawItem.equippingBlock
          ? {
              ammoType: rawItem.equippingBlock.ammoType || 0,
            }
          : undefined,
        itemCategoryHashes: rawItem.itemCategoryHashes || [],
        itemType: rawItem.itemType || 0,
        itemSubType: rawItem.itemSubType || 0,
        classType: rawItem.classType || 3,
        equippable: rawItem.equippable || false,
        defaultDamageType: rawItem.defaultDamageType || 0,
        redacted: rawItem.redacted || false,
        blacklisted: rawItem.blacklisted || false,
        investmentStats: rawItem.investmentStats || undefined,
        perks: rawItem.perks || undefined,
      };

      const perks = await getDestinyEntityDefinition($http, {
        entityType: "DestinySandboxPerkDefinition",
        hashIdentifier: rawItem.perks?.[0]?.perkHash,
      });

      console.log("[getItemDetails] Perks fetched:", perks);

      return this.applyMappingsToItem(destinyItem);
    } catch (error) {
      if (
        error instanceof DestinyAPIError ||
        error instanceof DestinyManifestError
      ) {
        throw error;
      }

      throw new DestinyManifestError(
        `Failed to get item details for hash ${itemHash}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }
}

export { DestinyItemFinder, DestinyManifest };
