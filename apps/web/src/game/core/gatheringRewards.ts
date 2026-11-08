import type { ResourceId } from "@xmoonverse/shared";
import type { ProfessionId } from "./professions";
import { getGatheringNodeById, canGatherResource } from "./gathering";

export interface GatheringResult {
  nodeId: string;
  resourceId: ResourceId;
  quantity: number;
  experience: number;
}

export function gatherResource(
  nodeId: string,
  characterLevel: number,
  professionId: ProfessionId,
  professionLevel: number,
  random: () => number = Math.random
): GatheringResult {
  const node = getGatheringNodeById(nodeId);

  if (!node) {
    throw new Error("Unknown gathering node");
  }

  if (
    !canGatherResource(
      nodeId,
      characterLevel,
      professionId,
      professionLevel
    )
  ) {
    throw new Error("Gathering requirements are not met");
  }

  const roll = random();

  if (
    !Number.isFinite(roll) ||
    roll < 0 ||
    roll >= 1
  ) {
    throw new Error("Random value must be between 0 and 1");
  }

  const quantity = 1 + Math.floor(roll * 3);

  return {
    nodeId: node.id,
    resourceId: node.resourceId,
    quantity,
    experience: node.experienceReward
  };
}