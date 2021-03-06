import { NPC } from '../../../../../shared/models/npc';
import { VendorResponses } from '../../common-responses';

export const setup = async (npc: NPC) => {
  npc.hostility = 'Never';

  const vendorItems = [
    'Lockpick',
    'Antanian FireMist Thief Trap',
    'Antanian IceMist Thief Trap',
    'Antanian Poison Thief Trap',
    'Antanian MagicMissile Thief Trap',
    'Antanian Afflict Thief Trap',
    'Antanian Distraction Thief Trap',
    'Weak Disease Potion (5oz)',
    'Weak Blind Potion (5oz)',
    'Weak BlurredVision Potion (5oz)'
  ];

  npc.$$room.npcLoader.loadVendorItems(npc, vendorItems);

  npc.rightHand = await npc.$$room.npcLoader.loadItem('Lockpick');
  npc.leftHand = await npc.$$room.npcLoader.loadItem('Antanian FireMist Thief Trap');
  npc.gear.Armor = await npc.$$room.npcLoader.loadItem('Antanian Tunic');
  npc.recalculateStats();
};

export const responses = (npc: NPC) => {
  VendorResponses(npc, { classRestriction: 'Thief' });
};
