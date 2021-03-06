
import { random, isUndefined } from 'lodash';

import { SpellEffect } from '../../base/Effect';
import { Character } from '../../../shared/models/character';
import { Skill } from '../../base/Skill';
import * as dice from 'dice.js';
import { MessageHelper } from '../../helpers/world/message-helper';

export class IceMist extends SpellEffect {

  maxSkillForSkillGain = 15;
  skillMults = [[0, 2], [6, 2.25], [11, 2.5], [16, 2.75], [21, 3]];

  private range: number;

  cast(caster: Character, target: Character|{ x: number, y: number }, skillRef?: Skill) {
    this.setPotencyAndGainSkill(caster, skillRef);

    const range = (isUndefined(this.range) ? 1 : this.range) + (caster.getTraitLevel('IceMistWiden') ? 1 : 0);

    this.effectMessageRadius(caster, { message: 'You see a dense fog form.', subClass: 'combat magic' }, 10);

    MessageHelper.drawEffectInRadius(caster, 'ICE_MIST', target, range, 6);

    const attacked = caster.$$room.state.getAllInRange(target, range, [], false);

    const friendlyFireMod = caster.getTraitLevelAndUsageModifier('FriendlyFire');

    attacked.forEach(refTarget => {

      if(friendlyFireMod > 0) {
        const roll = random(0, 100);
        if(roll <= friendlyFireMod && !caster.$$room.state.checkTargetForHostility(caster, target)) return;
      }

      const damage = +dice.roll(`${this.getTotalDamageRolls(caster)}d${this.getTotalDamageDieSize(caster)}`);

      const dist = caster.distFrom(refTarget);

      let damageMod = 1;
      if(dist >= 2) damageMod = 0.75;
      if(dist >= 3) damageMod = 0.5;

      const atkName = refTarget === caster ? 'yourself' : refTarget.name;

      this.magicalAttack(caster, refTarget, {
        skillRef,
        atkMsg: `You engulf ${atkName} in a chilling mist!`,
        defMsg: `${this.getCasterName(caster, refTarget)} engulfed you in a chilling mist!`,
        damage: Math.floor(damage * damageMod),
        damageClass: 'ice'
      });
    });
  }
}
