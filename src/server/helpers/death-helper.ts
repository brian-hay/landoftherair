

import { Player } from '../../shared/models/player';
import { Item } from '../../shared/models/item';
import { Character } from '../../shared/models/character';
import { NPC } from '../../shared/models/npc';

import { LootHelper } from './loot-helper';

export class DeathHelper {

  static autoReviveAndUncorpse(player: Player) {
    if(!player.isDead()) return;
    player.restore(false);
  }

  static corpseCheck(player, specificCorpse?: Item) {

    let item = null;

    if(player.leftHand
      && player.leftHand.itemClass === 'Corpse'
      && (!specificCorpse || (specificCorpse && player.leftHand === specificCorpse) )) {
      item = player.leftHand;
      player.setLeftHand(null);
    }

    if(player.rightHand
      && player.rightHand.itemClass === 'Corpse'
      && (!specificCorpse || (specificCorpse && player.rightHand === specificCorpse) )) {
      item = player.rightHand;
      player.setRightHand(null);
    }

    if(item) {
      item.$heldBy = null;
      player.$$room.addItemToGround(player, item);
    }
  }

  static async createCorpse(target: Character, searchItems = [], customSprite = 0): Promise<Item> {
    const corpse = await target.$$room.itemCreator.getItemByName('Corpse');
    corpse.sprite = customSprite || target.sprite + 4;
    corpse.searchItems = searchItems;
    corpse.desc = `the corpse of a ${target.name}`;
    corpse.name = `${target.name} corpse`;

    target.$$room.addItemToGround(target, corpse);

    const isPlayer = target.isPlayer();
    corpse.$$isPlayerCorpse = isPlayer;

    target.$$corpseRef = corpse;

    if(!isPlayer) {
      corpse.tansFor = (<any>target).tansFor;
      (<any>corpse).npcUUID = target.uuid;
      corpse.$$playersHeardDeath = target.$$room.state.getPlayersInRange(target, 6).map(x => (<Player>x).username);
    }

    return corpse;
  }


  static async calculateLootDrops(npc: NPC, killer: Character) {
    const bonus = killer.getTotalStat('luk');

    if(!killer.isPlayer()) {
      this.createCorpse(npc, []);
      return;
    }

    const allItems = await LootHelper.getAllLoot(npc, bonus);

    if(npc.gold) {
      const adjustedGold = npc.$$room.calcAdjustedGoldGain(npc.gold);
      const gold = await npc.$$room.itemCreator.getGold(adjustedGold);
      allItems.push(gold);
    }

    this.createCorpse(npc, allItems);
  }
}