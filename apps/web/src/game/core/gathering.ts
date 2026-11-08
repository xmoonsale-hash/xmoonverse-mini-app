import type { ResourceId } from "@xmoonverse/shared";
import type { ProfessionId } from "./professions";
import { getRegionById } from "./world";
import { getProfessionById } from "./professions";

export interface GatheringNode {
  id: string;
  name: string;
  description: string;
  regionId: string;
  professionId: ProfessionId;
  resourceId: ResourceId;
  requiredProfessionLevel: number;
  gatheringTimeSeconds: number;
  experienceReward: number;
}

export const GATHERING_NODES: GatheringNode[] = [
  {
    id: "greenhaven_trees",
    name: "Лесные деревья",
    description: "Деревья, подходящие для добычи древесины.",
    regionId: "greenhaven",
    professionId: "woodcutting",
    resourceId: "wood",
    requiredProfessionLevel: 1,
    gatheringTimeSeconds: 10,
    experienceReward: 5
  },
  {
    id: "greenhaven_stones",
    name: "Каменные залежи",
    description: "Небольшие залежи обычного камня.",
    regionId: "greenhaven",
    professionId: "mining",
    resourceId: "stone",
    requiredProfessionLevel: 1,
    gatheringTimeSeconds: 12,
    experienceReward: 6
  },
  {
    id: "greenhaven_herbs",
    name: "Лесные травы",
    description: "Дикие растения для алхимических рецептов.",
    regionId: "greenhaven",
    professionId: "herbalism",
    resourceId: "wild_herb",
    requiredProfessionLevel: 1,
    gatheringTimeSeconds: 8,
    experienceReward: 5
  },
  {
    id: "iron_peaks_ore",
    name: "Железные залежи",
    description: "Богатые жилы железной руды.",
    regionId: "iron_peaks",
    professionId: "mining",
    resourceId: "iron_ore",
    requiredProfessionLevel: 5,
    gatheringTimeSeconds: 20,
    experienceReward: 15
  },
  {
    id: "iron_peaks_crystals",
    name: "Лунные кристаллы",
    description: "Редкие кристаллические образования.",
    regionId: "iron_peaks",
    professionId: "mining",
    resourceId: "moon_crystal",
    requiredProfessionLevel: 15,
    gatheringTimeSeconds: 35,
    experienceReward: 30
  }
];

export function getGatheringNodeById(
  nodeId: string
): GatheringNode | undefined {
  return GATHERING_NODES.find(
    (node) => node.id === nodeId
  );
}

export function getGatheringNodesByRegion(
  regionId: string
): GatheringNode[] {
  return GATHERING_NODES.filter(
    (node) => node.regionId === regionId
  );
}

export function getGatheringNodesByProfession(
  professionId: ProfessionId
): GatheringNode[] {
  return GATHERING_NODES.filter(
    (node) => node.professionId === professionId
  );
}

export function canGatherResource(
  nodeId: string,
  characterLevel: number,
  professionId: ProfessionId,
  professionLevel: number
): boolean {
  const node = getGatheringNodeById(nodeId);

  if (!node) {
    return false;
  }

  const region = getRegionById(node.regionId);
  const profession = getProfessionById(professionId);

  if (!region || !profession) {
    return false;
  }

  return (
    node.professionId === professionId &&
    characterLevel >= region.recommendedLevel &&
    professionLevel >= node.requiredProfessionLevel
  );
}