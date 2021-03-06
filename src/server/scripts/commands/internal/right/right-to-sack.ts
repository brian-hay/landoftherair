
import { Command } from '../../../../base/Command';
import { Player } from '../../../../../shared/models/player';

export class RightToSack extends Command {

  public name = '~RtS';
  public format = '';

  execute(player: Player) {
    if(this.isAccessingLocker(player)) return;
    const item = player.rightHand;
    if(!item) return;

    if(!player.addItemToSack(item)) return;
    player.setRightHand(null);
  }

}
