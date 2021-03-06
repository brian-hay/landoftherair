
import { Command } from '../../../../base/Command';
import { Player } from '../../../../../shared/models/player';

export class LeftToMerchant extends Command {

  public name = '~LtM';
  public format = 'MerchantUUID';

  execute(player: Player, { args }) {
    const item = player.leftHand;

    if(this.isAccessingLocker(player)) return;
    if(!item) return;
    if(!item.isOwnedBy(player)) return player.sendClientMessage('That is not yours!');

    if(!this.checkMerchantDistance(player, args)) return;

    player.sellItem(item);
    player.setLeftHand(null);
  }

}
