"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const character_1 = require("../../models/character");
const item_1 = require("../../models/item");
const Classes = require("../classes");
const Effects = require("../effects");
const dice = require("dice.js");
class CombatHelper {
    static isShield(item) {
        return lodash_1.includes(item_1.ShieldClasses, item.itemClass);
    }
    static resolveThrow(attacker, defender, hand, item) {
        if (item.returnsOnThrow)
            return;
        attacker[`set${lodash_1.capitalize(hand)}Hand`](null);
        if (item.itemClass === 'Bottle') {
            defender.sendClientMessageToRadius({
                message: `You hear the sound of glass shattering!`, subClass: 'combat'
            }, 5);
        }
        else {
            defender.$$room.addItemToGround(defender, item);
        }
    }
    static physicalAttack(attacker, defender, opts = {}) {
        const { isThrow, throwHand, isBackstab, isMug, attackRange } = opts;
        if (defender.isDead() || attacker.isDead())
            return { isDead: true };
        attacker.combatTicks = 10;
        defender.combatTicks = 10;
        let attackerWeapon;
        if (isThrow) {
            attackerWeapon = attacker[`${throwHand}Hand`];
        }
        else {
            attackerWeapon = attacker.rightHand
                || attacker.gear.Hands
                || { type: character_1.SkillClassNames.Martial, itemClass: 'Gloves', name: 'hands',
                    minDamage: 1, maxDamage: 1, baseDamage: 1,
                    isOwnedBy: () => true, hasCondition: () => true, loseCondition: (x, y) => { } };
        }
        const flagSkills = [];
        flagSkills[0] = attackerWeapon.type;
        if (attackerWeapon.secondaryType)
            flagSkills[1] = attackerWeapon.secondaryType;
        attacker.flagSkill(flagSkills);
        if (isThrow)
            flagSkills[1] = character_1.SkillClassNames.Throwing;
        if (isBackstab)
            flagSkills[1] = character_1.SkillClassNames.Thievery;
        if (!attackerWeapon.isOwnedBy(attacker) || !attackerWeapon.hasCondition()) {
            if (!isThrow || (isThrow && attackerWeapon.returnsOnThrow)) {
                attacker.$$room.addItemToGround(attacker, attacker.rightHand);
                attacker.setRightHand(null);
            }
            attacker.sendClientMessage({ message: `Your hand feels a burning sensation!`, target: defender.uuid });
            return;
        }
        let defenderArmor = null;
        if (!defenderArmor && defender.gear.Robe2 && defender.gear.Robe2.hasCondition())
            defenderArmor = defender.gear.Robe2;
        if (!defenderArmor && defender.gear.Robe1 && defender.gear.Robe1.hasCondition())
            defenderArmor = defender.gear.Robe1;
        if (!defenderArmor && defender.gear.Armor && defender.gear.Armor.hasCondition())
            defenderArmor = defender.gear.Armor;
        if (!defenderArmor)
            defenderArmor = { hasCondition: () => true,
                isOwnedBy: (x) => true,
                loseCondition: (x, y) => { },
                conditionACModifier: () => 0 };
        const defenderBlocker = defender.rightHand
            || { type: character_1.SkillClassNames.Martial, itemClass: 'Gloves', name: 'hands', conditionACModifier: () => 0,
                hasCondition: () => true, isOwnedBy: (x) => true, loseCondition: (x, y) => { } };
        const defenderShield = defender.leftHand && this.isShield(defender.leftHand)
            ? defender.leftHand
            : null;
        // skill + 1 because skill 0 is awful
        const attackerScope = {
            skill: attacker.calcSkillLevel(isThrow ? character_1.SkillClassNames.Throwing : attackerWeapon.type) + 1,
            offense: attacker.getTotalStat('offense'),
            accuracy: attacker.getTotalStat('accuracy'),
            dex: attacker.getTotalStat('dex'),
            str: attacker.getTotalStat('str'),
            str4: Math.floor(attacker.getTotalStat('str') / 4),
            multiplier: Classes[attacker.baseClass || 'Undecided'].combatDamageMultiplier,
            level: 1 + Math.floor(attacker.level / Classes[attacker.baseClass || 'Undecided'].combatLevelDivisor),
            damageMin: attackerWeapon.minDamage,
            damageMax: attackerWeapon.maxDamage,
            damageBase: attackerWeapon.baseDamage
        };
        const defenderACBoost = defenderArmor.conditionACModifier() + (defenderShield ? defenderShield.conditionACModifier() : 0);
        const defenderScope = {
            skill: defender.calcSkillLevel(defenderBlocker.type) + 1,
            defense: defender.getTotalStat('defense'),
            agi: defender.getTotalStat('agi'),
            dex: defender.getTotalStat('dex'),
            dex4: Math.floor(defender.getTotalStat('dex') / 4),
            armorClass: defender.getTotalStat('armorClass') + defenderACBoost,
            shieldAC: defenderShield ? defenderShield.stats.armorClass : 0,
            shieldDefense: defenderShield ? defenderShield.stats.defense || 0 : 0,
            level: 1 + Math.floor(defender.level / Classes[defender.baseClass || 'Undecided'].combatLevelDivisor)
        };
        attackerWeapon.loseCondition(1, () => attacker.recalculateStats());
        defender.addAgro(attacker, 1);
        // try to dodge
        const attackerDodgeBlockLeftSide = Math.floor(10 + attackerScope.skill + attackerScope.offense + attackerScope.accuracy);
        const attackerDodgeBlockRightSide = Math.floor(attackerScope.dex + attackerScope.level + attackerScope.skill);
        const defenderDodgeBlockLeftSide = Math.floor(1 + defenderScope.defense);
        const defenderDodgeRightSide = Math.floor(defenderScope.dex4 + defenderScope.agi + defenderScope.level);
        const attackerDodgeRoll = +dice.roll(`${attackerDodgeBlockLeftSide}d${attackerDodgeBlockRightSide}`);
        const defenderDodgeRoll = -+dice.roll(`${defenderDodgeBlockLeftSide}d${defenderDodgeRightSide}`);
        const attackDistance = attackRange ? attackRange : 0;
        const distBetween = attacker.distFrom(defender);
        const dodgeRoll = lodash_1.random(defenderDodgeRoll, attackerDodgeRoll);
        if (dodgeRoll < 0 || attackDistance < distBetween) {
            attacker.sendClientMessage({ message: `You miss!`, subClass: 'combat self miss', target: defender.uuid });
            defender.sendClientMessage({ message: `${attacker.name} misses!`, subClass: 'combat other miss' });
            if (isThrow)
                this.resolveThrow(attacker, defender, throwHand, attackerWeapon);
            return { dodge: true };
        }
        // try to block with armor
        const defenderBlockRightSide = Math.floor(defenderScope.level);
        const attackerACRoll = Math.max(1, +dice.roll(`${attackerDodgeBlockLeftSide}d${attackerDodgeBlockRightSide}`) - defenderScope.armorClass);
        const defenderACRoll = -+dice.roll(`${defenderDodgeBlockLeftSide}d${defenderBlockRightSide}`);
        const acRoll = lodash_1.random(defenderACRoll, attackerACRoll);
        if (acRoll < 0) {
            attacker.sendClientMessage({ message: `You were blocked by armor!`, subClass: 'combat self block armor', target: defender.uuid });
            defender.sendClientMessage({ message: `${attacker.name} was blocked by your armor!`, subClass: 'combat other block armor' });
            defenderArmor.loseCondition(1, () => defender.recalculateStats());
            if (isThrow)
                this.resolveThrow(attacker, defender, throwHand, attackerWeapon);
            return { block: true, blockedBy: 'armor' };
        }
        // try to block with weapon
        const attackerWeaponShieldBlockRightSide = Math.floor(attackerScope.str4 + attackerScope.dex + attackerScope.skill);
        const defenderWeaponBlockLeftSide = 1;
        const defenderWeaponBlockRightSide = Math.floor(defenderScope.dex4 + defenderScope.skill);
        const attackerWeaponBlockRoll = +dice.roll(`${attackerDodgeBlockLeftSide}d${attackerWeaponShieldBlockRightSide}`);
        const defenderWeaponBlockRoll = -+dice.roll(`${defenderWeaponBlockLeftSide}d${defenderWeaponBlockRightSide}`);
        const weaponBlockRoll = lodash_1.random(attackerWeaponBlockRoll, defenderWeaponBlockRoll);
        if (weaponBlockRoll < 0 && defenderBlocker.isOwnedBy(defender) && defenderBlocker.hasCondition()) {
            const itemTypeToLower = defenderBlocker.itemClass.toLowerCase();
            attacker.sendClientMessage({ message: `You were blocked by a ${itemTypeToLower}!`, subClass: 'combat self block weapon', target: defender.uuid });
            defender.sendClientMessage({ message: `${attacker.name} was blocked by your ${itemTypeToLower}!`, subClass: 'combat other block weapon' });
            defenderBlocker.loseCondition(1, () => defender.recalculateStats());
            if (isThrow)
                this.resolveThrow(attacker, defender, throwHand, attackerWeapon);
            return { block: true, blockedBy: `a ${itemTypeToLower}` };
        }
        // try to block with shield
        if (defenderShield && defender.leftHand.isOwnedBy(defender) && defenderShield.hasCondition()) {
            const defenderShieldBlockLeftSide = Math.floor(1 + defenderScope.shieldDefense);
            const defenderShieldBlockRightSide = Math.floor(defenderScope.dex4 + defenderScope.skill);
            const attackerShieldBlockRoll = Math.max(1, +dice.roll(`${attackerDodgeBlockLeftSide}d${attackerWeaponShieldBlockRightSide}`) - defenderScope.shieldAC);
            const defenderShieldBlockRoll = -+dice.roll(`${defenderShieldBlockLeftSide}d${defenderShieldBlockRightSide}`);
            const shieldBlockRoll = lodash_1.random(attackerShieldBlockRoll, defenderShieldBlockRoll);
            if (shieldBlockRoll < 0) {
                const itemTypeToLower = defenderShield.itemClass.toLowerCase();
                attacker.sendClientMessage({ message: `You were blocked by a ${itemTypeToLower}!`, subClass: 'combat self block shield', target: defender.uuid });
                defender.sendClientMessage({ message: `${attacker.name} was blocked by your ${itemTypeToLower}!`, subClass: 'combat other block shield' });
                defenderShield.loseCondition(1, () => defender.recalculateStats());
                if (isThrow)
                    this.resolveThrow(attacker, defender, throwHand, attackerWeapon);
                return { block: true, blockedBy: `a ${itemTypeToLower}` };
            }
        }
        const damageLeft = Math.floor(attackerScope.skill);
        const damageMax = lodash_1.random(attackerScope.damageMin, attackerScope.damageMax);
        const damageRight = Math.floor(attackerScope.str + attackerScope.level + damageMax);
        let damage = Math.floor(+dice.roll(`${damageLeft}d${damageRight}`) * attackerScope.multiplier) + attackerScope.damageBase;
        if (isBackstab) {
            const thiefSkill = attacker.calcSkillLevel(character_1.SkillClassNames.Thievery);
            const bonusMultiplier = attacker.baseClass === 'Thief' ? 2 + Math.floor(thiefSkill / 5) : 1.5;
            damage = Math.floor(damage * bonusMultiplier);
        }
        if (isMug) {
            const thiefSkill = attacker.calcSkillLevel(character_1.SkillClassNames.Thievery);
            const reductionFactor = 1 - Math.max(0.5, 0.9 - (attacker.baseClass === 'Thief' ? Math.floor(thiefSkill / 5) / 10 : 0));
            damage = Math.floor(damage * reductionFactor);
        }
        let damageType = 'was a successful strike';
        if (attackerScope.damageMin !== attackerScope.damageMax) {
            if (attackerScope.damageMin === damageMax)
                damageType = 'was a grazing blow';
            if (attackerScope.damageMax === damageMax)
                damageType = 'left a grievous wound';
        }
        let msg = '';
        if (attacker.rightHand) {
            msg = `${attacker.name} hits with a ${attackerWeapon.itemClass.toLowerCase()}!`;
        }
        else if (attackerWeapon.itemClass === 'Claws') {
            msg = `${attacker.name} claws you!`;
        }
        else {
            msg = `${attacker.name} punches you!`;
        }
        damage = this.dealDamage(attacker, defender, {
            damage,
            damageClass: 'physical',
            attackerDamageMessage: `Your attack ${damageType}!`,
            defenderDamageMessage: msg
        });
        if (isThrow)
            this.resolveThrow(attacker, defender, throwHand, attackerWeapon);
        if (attackerWeapon.effect) {
            this.tryApplyEffect(attacker, defender, attackerWeapon.effect);
        }
        if (damage <= 0) {
            return { noDamage: true };
        }
        return { hit: true, damage, dealtBy: attackerWeapon.itemClass.toLowerCase(), damageType };
    }
    static tryApplyEffect(attacker, defender, effect) {
        const applyEffect = Effects[effect.name];
        if (!applyEffect)
            return;
        const chance = effect.chance || 100;
        if (+dice.roll('1d100') > chance)
            return;
        const appEffect = new applyEffect(effect);
        if (!appEffect.cast)
            return;
        appEffect.cast(attacker, defender);
    }
    static magicalAttack(attacker, attacked, { effect, skillRef, atkMsg, defMsg, damage, damageClass } = {}) {
        if (attacker) {
            attacker.combatTicks = 10;
        }
        attacked.combatTicks = 10;
        if (skillRef && attacker) {
            attacker.flagSkill(skillRef.flagSkills);
        }
        const willCheck = +dice.roll('1d500') <= attacked.getTotalStat('wil');
        if (willCheck) {
            const willDivisor = Classes[attacked.baseClass || 'Undecided'].willDivisor;
            damage -= Math.floor(damage / willDivisor);
        }
        this.dealDamage(attacker, attacked, { damage, damageClass, attackerDamageMessage: atkMsg, defenderDamageMessage: defMsg });
    }
    static dealOnesidedDamage(defender, { damage, damageClass, damageMessage, suppressIfNegative }) {
        if (defender.isDead())
            return;
        const isHeal = damage < 0;
        if (!isHeal) {
            const damageReduced = defender.getTotalStat(`${damageClass}Resist`);
            damage -= damageReduced;
            // non-physical attacks are magical
            if (damageClass !== 'physical') {
                const magicReduction = defender.getTotalStat('magicalResist');
                damage -= magicReduction;
            }
        }
        if (!isHeal && damage < 0)
            damage = 0;
        defender.hp.sub(damage);
        if ((damage <= 0 && !suppressIfNegative) || damage > 0) {
            defender.sendClientMessage({ message: `${damageMessage} [${damage} ${damageClass} damage]`, subClass: 'combat other hit' });
        }
        if (defender.isDead()) {
            defender.sendClientMessage({ message: `You died!`, subClass: 'combat other kill' });
            defender.die();
        }
        if (damage < 0)
            return 0;
    }
    static dealDamage(attacker, defender, { damage, damageClass, attackerDamageMessage, defenderDamageMessage }) {
        if (defender.isDead() || defender.hostility === 'Never')
            return;
        const isHeal = damage < 0;
        // if not healing, check for damage resist
        if (!isHeal) {
            const damageReduced = defender.getTotalStat(`${damageClass}Resist`);
            damage -= damageReduced;
            // non-physical attacks are magical
            if (damageClass !== 'physical') {
                const magicReduction = defender.getTotalStat('magicalResist');
                damage -= magicReduction;
            }
            if (damage < 0)
                damage = 0;
            if (damageReduced > 0 && damage !== 0 && attacker && attacker !== defender) {
                attacker.sendClientMessage({ message: `Your attack is mangled by a magical force!`, subClass: `combat self blocked`, target: defender.uuid });
            }
            if (attacker && attacker !== defender && damage === 0) {
                attacker.sendClientMessage({ message: `Your attack did no visible damage!`, subClass: `combat self blocked`, target: defender.uuid });
            }
        }
        const absDmg = Math.abs(damage);
        const dmgString = isHeal ? 'health' : `${damageClass} damage`;
        const otherClass = isHeal ? 'heal' : 'hit';
        const damageType = damageClass === 'physical' ? 'melee' : 'magic';
        if (attackerDamageMessage && attacker.username) {
            const secondaryClass = attacker !== defender ? 'self' : 'other';
            attacker.sendClientMessage({
                message: `${attackerDamageMessage} [${absDmg} ${dmgString}]`,
                subClass: `combat ${secondaryClass} ${otherClass} ${damageType}`,
                target: defender.uuid
            });
        }
        if (defenderDamageMessage && attacker !== defender) {
            defender.sendClientMessage({
                message: `${defenderDamageMessage} [${absDmg} ${dmgString}]`,
                subClass: `combat other ${otherClass} ${damageType}`
            });
        }
        defender.hp.sub(damage);
        const wasFatal = defender.isDead();
        if (!wasFatal) {
            if (defender !== attacker) {
                defender.addAgro(attacker, damage);
            }
        }
        else {
            if (attacker) {
                defender.sendClientMessageToRadius({
                    message: `${defender.name} was killed by ${attacker.name}!`, subClass: 'combat self kill'
                }, 5, [defender.uuid]);
                defender.sendClientMessage({ message: `You were killed by ${attacker.name}!`, subClass: 'combat other kill' });
                defender.die(attacker);
                if (attacker.uuid) {
                    attacker.kill(defender);
                }
            }
            else {
                defender.sendClientMessageToRadius({ message: `${defender.name} was killed!`, subClass: 'combat self kill' }, 5, [defender.uuid]);
                defender.sendClientMessage({ message: `You were killed!`, subClass: 'combat other kill' });
                defender.die(attacker);
            }
        }
        return damage;
    }
}
exports.CombatHelper = CombatHelper;
//# sourceMappingURL=combat-helper.js.map