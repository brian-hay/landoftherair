
import { Trait } from '../../models/trait';

export class OffhandFinesse extends Trait {

  static baseClass = 'Warrior';
  static traitName = 'OffhandFinesse';
  static description = 'Increase your offhand attack damage by $10|30$%.';
  static icon = 'crossed-axes';

  static upgrades = [
    { }, { }, { }, { }, { requireCharacterLevel: 15, capstone: true }
  ];
}
