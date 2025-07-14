/**
 * TypeScript type for raw Destiny 2 item data from Bungie API
 */
export interface DestinyItemRaw {
  displayProperties: {
    description: string;
    name: string;
    icon: string;
    hasIcon: boolean;
  };
  tooltipNotifications: any[];
  collectibleHash?: number;
  iconWatermark?: string;
  iconWatermarkShelved?: string;
  backgroundColor?: {
    red: number;
    green: number;
    blue: number;
    alpha: number;
  };
  screenshot?: string;
  itemTypeDisplayName: string;
  flavorText: string;
  uiItemDisplayStyle: string;
  itemTypeAndTierDisplayName: string;
  displaySource: string;
  action?: {
    verbName: string;
    verbDescription: string;
    isPositive: boolean;
    requiredCooldownSeconds: number;
    requiredItems: any[];
    progressionRewards: any[];
    actionTypeLabel: string;
    rewardSheetHash: number;
    rewardItemHash: number;
    rewardSiteHash: number;
    requiredCooldownHash: number;
    deleteOnAction: boolean;
    consumeEntireStack: boolean;
    useOnAcquire: boolean;
  };
  inventory: {
    maxStackSize: number;
    bucketTypeHash: number;
    recoveryBucketTypeHash?: number;
    tierTypeHash: number;
    isInstanceItem: boolean;
    nonTransferrableOriginal: boolean;
    tierTypeName: string;
    tierType: number;
    expirationTooltip: string;
    expiredInActivityMessage: string;
    expiredInOrbitMessage: string;
    suppressExpirationWhenObjectivesComplete: boolean;
    recipeItemHash?: number;
  };
  stats?: {
    disablePrimaryStatDisplay: boolean;
    statGroupHash: number;
    stats: { [key: string]: any };
    hasDisplayableStats: boolean;
    primaryBaseStatHash: number;
  };
  equippingBlock?: {
    uniqueLabel: string;
    uniqueLabelHash: number;
    equipmentSlotTypeHash: number;
    attributes: number;
    equippingSoundHash: number;
    hornSoundHash: number;
    ammoType: number;
    displayStrings: string[];
  };
  translationBlock?: {
    weaponPatternHash: number;
    defaultDyes: any[];
    lockedDyes: any[];
    customDyes: any[];
    arrangements: any[];
    hasGeometry: boolean;
  };
  preview?: {
    screenStyle: string;
    previewVendorHash: number;
    previewActionString: string;
  };
  quality?: {
    itemLevels: any[];
    qualityLevel: number;
    infusionCategoryName: string;
    infusionCategoryHash: number;
    infusionCategoryHashes: number[];
    progressionLevelRequirementHash: number;
    currentVersion: number;
    versions: any[];
    displayVersionWatermarkIcons: string[];
  };
  acquireRewardSiteHash: number;
  acquireUnlockHash: number;
  sockets?: {
    detail: string;
    socketEntries: any[];
    intrinsicSockets: any[];
    socketCategories: any[];
  };
  investmentStats?: Array<{
    statTypeHash: number;
    value: number;
  }>;
  perks?: Array<{
    perkHash: number;
  }>;
  loreHash?: number;
  allowActions: boolean;
  doesPostmasterPullHaveSideEffects: boolean;
  nonTransferrable: boolean;
  itemCategoryHashes: number[];
  specialItemType: number;
  itemType: number;
  itemSubType: number;
  classType: number;
  breakerType: number;
  equippable: boolean;
  damageTypeHashes?: number[];
  damageTypes?: number[];
  defaultDamageType: number;
  defaultDamageTypeHash?: number;
  isWrapper: boolean;
  traitIds?: string[];
  traitHashes?: number[];
  hash: number;
  index: number;
  redacted: boolean;
  blacklisted: boolean;
}

/**
 * TypeScript type for Destiny 2 manifest items
 */
export interface DestinyItem {
  /** Unique hash identifier for the item */
  hash: number;

  /** Display properties containing user-visible information */
  displayProperties: {
    /** Item name */
    name: string;
    /** Item description */
    description: string;
    /** Icon path for the item */
    icon?: string;
    /** Whether the item has an icon */
    hasIcon: boolean;
  };

  /** Flavor text for the item */
  flavorText: string;

  /** Display name for the item type */
  itemTypeDisplayName: string;

  /** Combined item type and tier display name */
  itemTypeAndTierDisplayName: string;

  /** Inventory information */
  inventory: {
    /** Maximum stack size */
    maxStackSize: number;
    /** Tier type name (e.g., "Common", "Legendary", "Exotic") */
    tierTypeName: string;
    /** Numerical tier type */
    tierType: number;
  };

  /** Item type (e.g., weapon, armor) */
  equippingBlock?: {
    /** Ammo type for weapon items */
    ammoType: number;
  };

  /** Item categories */
  itemCategoryHashes: number[];

  /** Type of item */
  itemType: number;

  /** Sub-type of item */
  itemSubType: number;

  /** Class restriction (0 = Titan, 1 = Hunter, 2 = Warlock, 3 = Any) */
  classType: number;

  /** Whether the item is equippable */
  equippable: boolean;

  /** Default damage type */
  defaultDamageType: number;

  /** Whether the item is redacted (hidden) */
  redacted: boolean;

  /** Whether the item is blacklisted */
  blacklisted: boolean;

  /** Investment stats for the item */
  investmentStats?: Array<{
    /** Hash of the stat type */
    statTypeHash: number;
    /** Value of the stat */
    value: number;
  }>;

  /** Perks associated with the item */
  perks?: Array<{
    /** Hash of the perk */
    perkHash: number;
  }>;
}

/**
 * Type for the full manifest structure
 */
export interface DestinyManifest {
  [itemHash: string]: DestinyItem;
}
