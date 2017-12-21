
import { Command } from '../../../base/Command';
import { Player } from '../../../../shared/models/player';

export class GMCreateItem extends Command {

  public name = '@item';
  public format = 'ItemName';

  async execute(player: Player, { room, gameState, args }) {
    if(!player.isGM) return;

    const itemName = args;
    if(!itemName) return false;

    let item;
    try {
      item = await player.$$room.itemCreator.getItemByName(itemName, player.$$room);
    } catch(e) {
      player.sendClientMessage(`Warning: item "${itemName}" does not exist.`);
      return;
    }

    if(!player.rightHand) {
      player.setRightHand(item);
      return;
    }

    room.addItemToGround(player, item);
  }
}
