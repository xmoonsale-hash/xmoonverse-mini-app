
import type { ResourceId } from "@xmoonverse/shared";
import type { ProfessionId } from "./professions";

import { getGatheringNodeById, canGatherResource } from "./gathering";
import { getResourceById } from "./resources";
import { getItemById } from "./items";

export interface GatheringResult {
  nodeId: string;
  resourceId: ResourceId;
  quantity: number;
  experience: number;
}

const MIN_GATHERING_QUANTITY = 1;
const MAX_GATHERING_QUANTITY = 3;

function getRandomValue(random: () => number): number {
  if (typeof random !== "function") {
    throw new Error("Random source must be a function");
  }

  const value = random();

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value >= 1
  ) {
    throw new Error("Random value must be between 0 and 1");
  }

  return value;
}

function validateGatheringReward(
  nodeId: string
): void {
  const node = getGatheringNodeById(nodeId);

  if (!node) {
    throw new Error("Unknown gathering node");
  }

  const resource = getResourceById(node.resourceId);

  if (!resource) {
    throw new Error("Gathering resource is not configured");
  }

  const item = getItemById(resource.itemId);

  if (
    !item ||
    item.type !== "material" ||
    !item.stackable ||
    item.maxStack < MAX_GATHERING_QUANTITY
  ) {
    throw new Error("Invalid gathering reward item configuration");
  }
}

export function gatherResource(
  nodeId: string,
  characterLevel: number,
  professionId: ProfessionId,
  professionLevel: number,
  random: () => number = Math.random
): GatheringResult {
  if (
    typeof nodeId !== "string" ||
    !nodeId.trim()
  ) {
    throw new Error("Gathering node ID is required");
  }

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

  validateGatheringReward(nodeId);

  const roll = getRandomValue(random);

  const quantity =
    MIN_GATHERING_QUANTITY +
    Math.floor(
      roll *
        (MAX_GATHERING_QUANTITY - MIN_GATHERING_QUANTITY + 1)
    );

  if (
    !Number.isSafeInteger(quantity) ||
    quantity < MIN_GATHERING_QUANTITY ||
    quantity > MAX_GATHERING_QUANTITY
  ) {
    throw new Error("Invalid gathering reward quantity");
  }

  if (
    !Number.isSafeInteger(node.experienceReward) ||
    node.experienceReward <= 0
  ) {
    throw new Error("Invalid gathering experience reward");
  }

  return {
    nodeId: node.id,
    resourceId: node.resourceId,
    quantity,
    experience: node.experienceReward
  };
}
