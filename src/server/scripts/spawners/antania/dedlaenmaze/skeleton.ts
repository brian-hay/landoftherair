
import { Spawner } from '../../../../base/Spawner';

const npcIds = [
  { chance: 1,  result: 'Dedlaen Skeleton Knight' },
  { chance: 10, result: 'Dedlaen Skeleton' }
];

export class SkeletonSpawner extends Spawner {

  constructor(room, opts) {
    super(room, opts, {
      respawnRate: 20,
      initialSpawn: 2,
      maxCreatures: 4,
      spawnRadius: 0,
      randomWalkRadius: 45,
      leashRadius: 65,
      npcIds
    });
  }

}
