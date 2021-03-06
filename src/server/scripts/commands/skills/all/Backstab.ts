


import { Skill } from '../../../../base/Skill';
import { Character, SkillClassNames } from '../../../../../shared/models/character';
import { CombatHelper } from '../../../../helpers/world/combat-helper';
import { MoveHelper } from '../../../../helpers/character/move-helper';
import { MessageHelper } from '../../../../helpers/world/message-helper';

export class Backstab extends Skill {

  static macroMetadata = {
    name: 'Backstab',
    macro: 'backstab',
    icon: 'backstab',
    color: '#530000',
    mode: 'lockActivation',
    tooltipDesc: 'Backstab your target from the shadows. Requires Thievery skill 3.'
  };

  public name = 'backstab';
  public format = 'Target';

  requiresLearn = false;

  range(attacker: Character) {
    const weapon = attacker.rightHand;
    if(!weapon) return 0;

    if(weapon.twoHanded && attacker.leftHand) return -1;

    return weapon.attackRange || 0;
  }

  canUse(user: Character, target: Character) {
    return (user.hasEffect('Hidden') || user.hasEffect('ShadowMeld'))
      && this.range(user) + user.getTotalStat('move') >= user.distFrom(target);
  }


  execute(user: Character, { args }) {
    if(!args) return false;

    const hidden = user.hasEffect('Hidden');
    const shadowMeld = user.hasEffect('ShadowMeld');
    if(!hidden && !shadowMeld) return user.sendClientMessage('You are not hidden!');

    const weapon = user.rightHand;
    if(!weapon) return user.sendClientMessage('You need a weapon in your hand to backstab!');

    const userSkill = user.calcSkillLevel(SkillClassNames.Thievery);
    if(userSkill < 3) return user.sendClientMessage('You are not skilled enough to do that!');

    const range = this.range(user);
    if(range === -1) return user.sendClientMessage('You need to have your left hand empty to use that weapon!');

    const possTargets = MessageHelper.getPossibleMessageTargets(user, args);
    const target = possTargets[0];
    if(!target) return user.youDontSeeThatPerson(args);

    if(target === user) return;

    if(target.canSeeThroughStealthOf(user)) return user.sendClientMessage('You do not have the element of surprise!');

    if(hidden)      user.unapplyEffect(hidden, true);
    if(shadowMeld)  user.unapplyEffect(shadowMeld, true);
    this.use(user, target);
  }

  use(user: Character, target: Character) {
    const xDiff = target.x - user.x;
    const yDiff = target.y - user.y;

    MoveHelper.move(user, { room: user.$$room, gameState: user.$$room.state, x: xDiff, y: yDiff }, true);
    user.$$room.updatePos(user);

    CombatHelper.physicalAttack(user, target, { isBackstab: true, attackRange: this.range(user) });
  }

}
