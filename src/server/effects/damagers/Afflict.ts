
import { random } from 'lodash';

import { SpellEffect } from '../../base/Effect';
import { Character } from '../../../shared/models/character';
import { Skill } from '../../base/Skill';
import * as dice from 'dice.js';

export class Afflict extends SpellEffect {

  maxSkillForSkillGain = 30;
  skillMults = [[0, 2.75], [11, 3.75], [21, 4.75]];

  cast(caster: Character, target: Character, skillRef?: Skill) {
    this.setPotencyAndGainSkill(caster, skillRef);

    const damage = +dice.roll(`${this.getTotalDamageRolls(caster)}d${this.getTotalDamageDieSize(caster)}`);

    let isCrit = false;

    const holyAfflictionChance = caster.getTraitLevelAndUsageModifier('HolyAffliction');
    if(random(0, 100) <= holyAfflictionChance) {
      isCrit = true;
    }

    this.magicalAttack(caster, target, {
      skillRef,
      atkMsg: `You ${isCrit ? 'critically ' : ' '}afflict ${target.name}!`,
      defMsg: `${this.getCasterName(caster, target)} ${isCrit ? 'critically ' : ' '}afflicted you!`,
      damage: isCrit ? damage * 3 : damage,
      damageClass: 'necrotic'
    });
  }
}
