
import { omitBy, merge, find, includes, compact, pull, values, floor } from 'lodash';
import * as RestrictedNumber from 'restricted-number';
import {
  Item, EquippableItemClassesWithWeapons, EquipHash, GivesBonusInHandItemClasses
} from './item';
import { MapLayer } from './gamestate';
import { environment } from '../client/environments/environment';

export type Allegiance =
  'None'
| 'Pirates'
| 'Townsfolk'
| 'Royalty'
| 'Adventurers'
| 'Wilderness'
| 'Underground'

export type Sex = 'Male' | 'Female';

export type Direction = 'N' | 'S' | 'E' | 'W' | 'C';

export type CharacterClass =
  'Undecided';

export class Skills {
  mace = 0;
  axe = 0;
  dagger = 0;
  onehanded = 0;
  twohanded = 0;
  shortsword = 0;
  polearm = 0;
  ranged = 0;
  martial = 0;
  staff = 0;
  throwing = 0;
  thievery = 0;
  wand = 0;
  conjuration = 0;
  restoration = 0;
}

export class Stats {
  str = 0;
  dex = 0;
  agi = 0;

  int = 0;
  wis = 0;
  wil = 0;

  luk = 0;
  cha = 0;
  con = 0;

  move = 3;
  hpregen = 1;
  mpregen = 0;
}

export class Character {
  name: string;

  hp: RestrictedNumber = new RestrictedNumber(0, 100, 100);
  mp: RestrictedNumber = new RestrictedNumber(0, 0, 0);
  exp: number = 1000;

  gold: number = 0;

  stats: Stats = new Stats();
  totalStats: Stats = new Stats();

  skills: Skills = new Skills();

  allegiance: Allegiance = 'None';
  sex: Sex = 'Male';
  dir: Direction = 'S';

  x: number = 0;
  y: number = 0;
  map: string;

  level: number = 1;
  highestLevel: number = 1;

  baseClass: CharacterClass = 'Undecided';

  sack: Item[] = [];
  belt: Item[] = [];

  gear: any = {};
  leftHand: Item;
  rightHand: Item;

  swimLevel: number;

  $map: any;
  $deathTicks: number;
  $room: any;
  $corpseRef: Item;

  sprite: number;

  getSprite() {
    return 0;
  }

  get ageString() {
    return 'extremely young';
  }

  getTotalStat(stat) {
    return this.totalStats[stat];
  }

  initSack() {
    this.sack = this.sack.map(item => new Item(item));
  }

  initBelt() {
    this.belt = this.belt.map(item => new Item(item));
  }

  initHands() {
    if(this.leftHand) this.leftHand = new Item(this.leftHand);
    if(this.rightHand) this.rightHand = new Item(this.rightHand);
  }

  initGear() {
    Object.keys(this.gear).forEach(slot => {
      if(!this.gear[slot]) return;
      this.gear[slot] = new Item(this.gear[slot]);
    });
  }

  constructor(opts) {
    merge(this, opts);
    this.hp = new RestrictedNumber(this.hp.minimum, this.hp.maximum, this.hp.__current);
    this.mp = new RestrictedNumber(this.mp.minimum, this.mp.maximum, this.mp.__current);

    this.init();
  }

  init() {}

  toJSON() {
    return omitBy(this, (value, key) => {
      if(!Object.getOwnPropertyDescriptor(this, key)) return true;
      if(key === '_id' || key === '$map' || key === '$room' || key === '$corpseRef') return true;
      return false;
    });
  }

  hasEmptyHand() {
    return !this.leftHand || !this.rightHand;
  }

  determineItemType(itemClass) {
    return EquipHash[itemClass] || itemClass;
  }

  private getItemSlotToEquipIn(item: Item) {

    let slot = item.itemClass;

    if(item.isRobe()) {
      const armor = this.gear.Armor;
      const robe1 = this.gear.Robe1;
      const robe2 = this.gear.Robe2;

      if(armor && robe1 && robe2) return false;

      if(!armor) {
        slot = 'Armor';
      } else if(!robe1) {
        slot = 'Robe1';
      } else if(!robe2) {
        slot = 'Robe2';
      }

    } else if(item.isArmor()) {
      const armor = this.gear.Armor;
      if(armor) return false;

      slot = 'Armor';

    } else if(item.itemClass === 'Ring') {
      const ring1 = this.gear.Ring1;
      const ring2 = this.gear.Ring2;

      if(ring1 && ring2) return false;

      if(!ring1) {
        slot = 'Ring1';
      } else if(!ring2) {
        slot = 'Ring2';
      }
    } else {
      const realSlot = this.determineItemType(item.itemClass);
      if(!includes(['Head', 'Neck', 'Waist', 'Wrists', 'Hands', 'Feet', 'Ear'], realSlot)) return false;
      if(this.gear[realSlot]) return false;

      slot = realSlot;
    }

    return slot;
  }

  recalculateStats() {
    const allGear = compact(values(this.gear));

    const canGetBonusFromItemInHand = (item) => {
      return this.checkCanEquipWithoutGearCheck(item) && includes(GivesBonusInHandItemClasses, item.itemClass);
    };

    Object.keys(this.stats).forEach(stat => {
      this.totalStats[stat] = this.stats[stat];
    });

    const addStatsForItem = (item) => {
      Object.keys(item.stats).forEach(stat => {
        this.totalStats[stat] += item.stats[stat];
      })
    };

    allGear.forEach(item => {
      if(!item.stats || !this.checkCanEquipWithoutGearCheck(item)) return;
      addStatsForItem(item);
    });

    if(this.leftHand && this.leftHand.stats && canGetBonusFromItemInHand(this.leftHand))    addStatsForItem(this.leftHand);
    if(this.rightHand && this.rightHand.stats && canGetBonusFromItemInHand(this.rightHand)) addStatsForItem(this.rightHand);
  }

  itemCheck(item: Item) {
    if(!item) return;
    if(item.itemClass === 'Corpse') return;
  }

  setLeftHand(item: Item) {
    this.leftHand = item;
    this.itemCheck(item);
    this.recalculateStats();
  }

  setRightHand(item: Item) {
    this.rightHand = item;
    this.itemCheck(item);
    this.recalculateStats();
  }

  equip(item: Item) {
    const slot = this.getItemSlotToEquipIn(item);
    if(!slot) return false;

    this.gear[slot] = item;
    this.recalculateStats();
    this.itemCheck(item);
    return true;
  }

  private checkCanEquipWithoutGearCheck(item: Item) {
    if(!includes(EquippableItemClassesWithWeapons, item.itemClass)) return false;
    if(item.requirements) {
      if(item.requirements.level && this.level < item.requirements.level) return false;
      if(item.requirements.class && !includes(item.requirements.class, this.baseClass)) return false;
    }
    return true;
  }

  canEquip(item: Item) {
    if(!this.checkCanEquipWithoutGearCheck(item)) return false;

    const slot = this.getItemSlotToEquipIn(item);
    if(!slot || this.gear[slot]) return false;
    return true;
  }

  unequip(slot: string) {
    this.gear[slot] = null;
    this.recalculateStats();
  }

  private fixSack() {
    this.sack = compact(this.sack);
  }

  fullSack() {
    return this.sack.length >= 25;
  }

  addItemToSack(item: Item) {
    if(item.itemClass === 'Coin') {
      this.addGold(item);
      return;
    }
    this.itemCheck(item);
    this.sack.push(item);
  }

  takeItemFromSack(slot: number) {
    const item = this.sack[slot];
    pull(this.sack, item);
    this.fixSack();
    return item;
  }

  private fixBelt() {
    this.belt = compact(this.belt);
  }

  fullBelt() {
    return this.belt.length >= 5;
  }

  addItemToBelt(item: Item) {
    this.belt.push(item);
    this.fixBelt();
    this.itemCheck(item);
  }

  takeItemFromBelt(slot: number) {
    const item = this.belt[slot];
    pull(this.belt, item);
    this.fixBelt();
    return item;
  }

  addGold(gold: Item) {
    if(gold.value <= 0) return;
    this.gold += gold.value;
  }

  loseGold(gold: number) {
    this.gold -= gold;
    if(this.gold <= 0) this.gold = 0;
  }

  setDirBasedOnXYDiff(x, y) {

    const checkX = Math.abs(x);
    const checkY = Math.abs(y);

    if(checkX >= checkY) {
      if(x > 0) {
        this.dir = 'E';
      } else if(x < 0) {
        this.dir = 'W';
      }

    } else if(checkY > checkX) {
      if(y > 0) {
        this.dir = 'S';
      } else if(y < 0) {
        this.dir = 'N';
      }
    }
  }

  canSee(x, y): boolean {
    return true;
  }

  getXYFromDir(dir: Direction) {
    const checkDir = dir.toUpperCase();
    switch(checkDir) {
      case 'N':  return { x: 0,   y: -1 };
      case 'E':  return { x: 1,   y: 0 };
      case 'S':  return { x: 0,   y: 1 };
      case 'W':  return { x: -1,  y: 0 };
      case 'NW': return { x: -1,  y: 1 };
      case 'NE': return { x: 1,   y: 1 };
      case 'SW': return { x: -1,  y: -1 };
      case 'SE': return { x: -1,  y: 1 };
      default:   return { x: 0,   y: 0 };
    }
  }

  takeSequenceOfSteps(steps: any[]) {
    const denseTiles = this.$map.layers[MapLayer.Walls].data;
    const denseObjects: any[] = this.$map.layers[MapLayer.DenseDecor].objects;
    const interactables = this.$map.layers[MapLayer.Interactables].objects;
    const denseCheck = denseObjects.concat(interactables);

    steps.forEach(step => {
      const nextTileLoc = ((this.y + step.y) * this.$map.width) + (this.x + step.x);
      const nextTile = denseTiles[nextTileLoc];

      if(nextTile === 0) {
        const object = find(denseCheck, { x: (this.x + step.x)*64, y: (this.y + step.y + 1)*64 });
        if(object && object.density) {
          return;
        }
      } else {
        return;
      }

      if(!this.isValidStep(step)) return;
      this.x += step.x;
      this.y += step.y;
    });

    if(this.x < 0) this.x = 0;
    if(this.y < 0) this.y = 0;

    if(this.x > this.$map.width)  this.x = this.$map.width;
    if(this.y > this.$map.height) this.y = this.$map.height;
  }

  isValidStep(step) {
    return true;
  }

  isDead() {
    return this.hp.atMinimum();
  }

  changeBaseClass(newClass) {
    this.baseClass = newClass;
  }

  canDie() {
    return this.hp.atMinimum();
  }

  die(killer: Character) {
    this.dir = 'C';

    // TODO broadcast to all nearby who killed me
    // TODO make broadcastToVisiblePlayers function

    // 3 minutes to rot
    if(environment.production) {
      this.$deathTicks = 60 * 3;
    } else {
      this.$deathTicks = 10; //6 * 3;
    }
  }

  restore(force = false) {}

  gainExp(xp: number) {
    this.exp += xp;

    if(this.exp <= 100) {
      this.exp = 100;
    }

    if(xp < 0) {
      do {
        const prevLevelXp = this.calcLevelXP(this.level);
        if(this.exp < prevLevelXp && this.level >= 2) {
          this.level -= 1;
        } else {
          break;
        }
      } while(true);
    }
  }

  tryLevelUp() {
    do {
      const neededXp = this.calcLevelXP(this.level + 1);
      if(this.exp > neededXp) {
        this.level += 1;
        if(this.level > this.highestLevel) this.highestLevel = this.level;
      } else {
        break;
      }
    } while(true);
  }

  calcLevelXP(level: number) {
    if(level <= 20) {
      return Math.pow(2, level - 1) * 1000;
    }

    return 99999999999999999999999 * level;
  }

  tick() {
    if(this.isDead()) {
      if(this.$corpseRef && this.$corpseRef.$heldBy) {
        const holder = this.$room.state.findPlayer(this.$corpseRef.$heldBy);
        this.x = holder.x;
        this.y = holder.y;
      }

      if(this.$deathTicks > 0) {
        this.$deathTicks--;
        if(this.$deathTicks <= 0) {
          this.restore(true);
        }
      }

      return;
    }

    const hpRegen = this.getTotalStat('hpregen');
    const mpRegen = this.getTotalStat('mpregen');

    this.hp.add(hpRegen);
    this.mp.add(mpRegen);

    if(this.swimLevel > 0) {
      const hpPercentLost = this.swimLevel * 4;
      const hpLost = Math.floor(this.hp.maximum * (hpPercentLost/100));
      this.hp.sub(hpLost);
    }
  }
}
