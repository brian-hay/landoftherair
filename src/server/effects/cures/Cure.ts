
import { SpellEffect } from '../../base/Effect';
import { Character } from '../../../shared/models/character';
import { Skill } from '../../base/Skill';
import * as dice from 'dice.js';

export class Cure extends SpellEffect {

  maxSkillForSkillGain = 7;
  skillMults = [[0, 4], [11, 6], [21, 10]];

  cast(caster: Character, target: Character, skillRef?: Skill) {
    this.setPotencyAndGainSkill(caster, skillRef);

    const damage = -+dice.roll(`${this.getTotalDamageRolls(caster)}d${this.getTotalDamageDieSize(caster)}`);

    this.aoeAgro(caster, Math.abs(damage / 10));

    this.magicalAttack(caster, target, {
      skillRef,
      atkMsg: `You heal ${target.name}.`,
      defMsg: `${this.getCasterName(caster, target)} healed you!`,
      damage,
      damageClass: 'heal'
    });
  }
}
