import { NPC } from '../../../../../shared/models/npc';

const RENEGADE_BOOK = 'Rylt Renegade Book';

export const setup = async (npc: NPC) => {
  npc.hostility = 'Never';

  npc.rightHand = await npc.$$room.npcLoader.loadItem(RENEGADE_BOOK);
  npc.gear.Armor = await npc.$$room.npcLoader.loadItem('Antanian Tunic');
  npc.recalculateStats();
};

export const responses = (npc: NPC) => {
  npc.parser.addCommand('hello')
    .set('syntax', ['hello'])
    .set('logic', (args, { player }) => {
      if(npc.distFrom(player) > 0) return 'Please move closer.';

      if(npc.$$room.npcLoader.checkPlayerHeldItem(player, RENEGADE_BOOK)) {
        npc.$$room.npcLoader.takePlayerItem(player, RENEGADE_BOOK);

        npc.$$room.npcLoader.loadItem('Antanian Health Potion')
          .then(item => {
            item.binds = true;
            player.setRightHand(item);
          });

        return 'Well, thank you, kind adventurer. Here is your reward, as promised.';
      }

      return `Why, hello. It's not often that I get visitors down here in my hidey-hole. 
      I like to read, they call me the read-agade. Get it? 
      Anyway, if you can bring me some BOOKS to stave off the boredom of my already-vast collection, I'd be grateful. 
      Those muscleheads above us have some novels I've not yet read. 
      They're too dimwitted to understand the intricacies of the words on the page, so I'd appreciate them being given to someone who does. 
      Me, that is. Be warned though, those barbarians rip apart books on the regular.`;
    });

  npc.parser.addCommand('books')
    .set('syntax', ['books'])
    .set('logic', () => {
      return `Books, books. Ah yes. Rewards, you want one, yes? 
      If you bring me a book and hold it in your right hand, I'll give you a potion to permanently increase your health. 
      It's very handy. Be warned that it does have limitations.`;
    });
};
