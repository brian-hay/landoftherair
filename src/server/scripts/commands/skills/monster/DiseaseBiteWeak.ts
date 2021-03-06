


import * as dice from 'dice.js';

import { Skill } from '../../../../base/Skill';
import { Character } from '../../../../../shared/models/character';
import { Disease as CastEffect } from '../../../../effects/dots/Disease';
import { CombatHelper } from '../../../../helpers/world/combat-helper';

export class DiseaseBiteWeak extends Skill {

  name = 'diseasebiteweak';
  execute() {}

  canUse(user: Character, target: Character) {
    return user.distFrom(target) <= this.range() && !target.hasEffect('Disease');
  }

  use(user: Character, target: Character) {
    const damage = +dice.roll(`2d${user.getTotalStat('str')}`);
    CombatHelper.dealDamage(user, target, {
      damage,
      damageClass: 'physical',
      attackerDamageMessage: '',
      defenderDamageMessage: `${user.name} bit you!`
    });
    const effect = new CastEffect({ potency: 5, duration: 10 });
    effect.cast(user, target, this);
  }

}
