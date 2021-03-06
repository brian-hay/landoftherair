# Land of the Rair [![Build Status](https://travis-ci.org/LandOfTheRair/landoftherair.svg?branch=master)](https://travis-ci.org/LandOfTheRair/landoftherair)

A high fantasy MORPG inspired by the MUDs of olde.

## Contributor Disclaimer
While I appreciate contributions, consider that all contributions, significant or otherwise, cannot be compensated for at this time. 

## Requirements

* Node.js (recommended: 8.0.0+)
* npm (needed: 5.x+)
* MongoDB (recommended: 3.4.4+, or a hosted service, like MLab)
* Redis (or a hosted redis service, like Redis Lab)

## Install

* `npm install`
* `npm run setup`
* `npm start`

## Environment Variables

First, create a [`.env`](https://www.npmjs.com/package/dotenv) file in the root. Then, populate it with these values:

* `MONGODB_URI` - the URI that leads to a mongodb instance
* `AUTH0_SECRET` - Auth0 server secret
* `REDIS_URL` - a URI that leads to a redis cache

If you want strict validation of users (ie, if you're doing anything sensitive like taking payments), set these values:

* `AUTH0_JWKS_URI` - the URI that leads to the Auth0 JWKS JSON file

If you want to test Discord integration, you can also add:

* `DISCORD_SECRET` - the discord secret for your discord bot
* `DISCORD_GUILD` - the discord guild for your discord bot
* `DISCORD_WATCHER_ROLE` - the watcher role for your discord bot (default: "Event Watcher")
* `DISCORD_VERIFIED_ROLE` - the role for a user to get when they connect their discord (default: "Verified")
* `DISCORD_MUTED_ROLE` - the role for a user who is muted in game (default: "Muted")
* `DISCORD_SUBSCRIBER_ROLE` - the role for a user to get when they subscribe (default: "Subscriber")
* `DISCORD_CHANNEL` - the id of the channel for your discord bot to talk in
* `DISCORD_BOT_CHANNEL` - the id of the channel for your discord bot to listen for commands in
* `DISCORD_BOT_NAME` - the name of the bot as it was set up (default: "LandOfTheRairLobby")

If you want to test Stripe, you need to add:

* `STRIPE_TOKEN` - the Stripe secret key

Also, your bot will need a role that can assign roles.

## Setup

### Initial Setup

For initial setup, run this:

* `npm run setup`

### Content Creation

For subsequent updates and specific changes, you can run these instead:

* `npm run seed:items` - this will populate the database with items
* `npm run seed:npcs`  - this will populate the database with npc data
* `npm run seed:drops` - this will populate the database with drop table data
* `npm run seed:recipes` - this will populate the database with recipe data
* `npm run task:macros`- this will generate the macro icon metadata. If you add new icons, please only take from [my repository](http://seiyria.com/gameicons-font/).

## Making Yourself a GM

If you want to do any debugging, you'll need to make yourself a GM. To do that, you'll want to set your account to be a GM. Open up a mongo shell or run this query through an external tool:

```
db.accounts.update({ username: 'YOUR_ACCOUNT_NAME' }, { $set: { isGM: true } });
```

You only need to do this once.

### Server Debug Routes

Some routes are enabled for debugging purposes and are otherwise unused. You can visit:

* `/server` for server stats
* `/premium-stats` for premium buying stats
* `/item-stats` for avg. item stats
* `/logs` for server logs (log entries expire after 6h)
* `/maps` to see all of the maps in the game presently

### Commands

Some commands are hidden and don't really need to be used by players, but should be used when testing out moderation features. Commands have varying prefixes, such as:

* `~` - an internal command used by the UI
* `~~` - a debugging command for players
* `^` - a command for testers (and GMs)
* `@` - a command for GMs

#### Internal Commands

* `~clear` - clear the command buffer
* `~drink` - drink a potion from your potion slot
* `~interact` - called when clicking on something interactable
* `~look` - look at the ground (only used by `~search`)
* `~move` - called when clicking on the map to move
* `~restore` - be dead no more
* `~say` - talk to other players nearby
* `~search` - search corpses on the ground, then look
* `~talk` - called automatically when doing `xxx, message` - will trigger appropriate dialog for an npc if it has any
* `~trait` - buy traits
* `~unapply` - unapply a buff by name
* `~use` - use an item

#### Debugging Commands

* `~~pos` - get your current x, y, and map.
* `~~reset` - reset your buffs and additionalStats
* `~~items` - count the number of items in the world
* `~~mobs` - count the number of mobs in the world
* `~~ping` - check your ping
* `~~flagged` - check your flagged skills
* `~~lag` - run `pos`, `items`, `mobs`, and `ping`
* `~~combatlogstart <maxentries=1000>` - start logging combat data (this will clear any existing combat log data) - more than 1000 entries is not recommended
* `~~combatlogstop` - stop logging combat data
* `~~combatlogdownload` - download a CSV of your combat log data

#### Testing Commands

Certain accounts designated as testers get access to several in game commands:

* `^gold <gold>` - gain `<gold>` gold
* `^loadout <level>` - generate a loadout for your class level
* `^level <level>` - set your level to `<level>`
* `^owts <boost>` - increase all of your worn/held gear with an Owts enchantment by `<boost>`
* `^hp <newhp>` - set your hp to `<newhp>`
* `^mp <newmp>` - set your mp to `<newmp>`
* `^regen <newregen>` - set your hp/mp regen to `<newregen>`
* `^skills <level>` - set your skills to `<level>`
* `^stats <level>` set your stats to `<level>`
* `^traits` - reset your traits and gain 1000 TP

#### GM Commands

As a GM, you get access to several commands in the lobby:

* `/motd <motd>` - set the MOTD in the lobby
* `/resetmotd` - unset the MOTD
* `/alert <msg>` - alert every player with a certain message (very annoying!)
* `/subscribe <period> <account>` - set the account on a trial subscription lasting for `period` days
* `/unsubscribe <account>` - remove the accounts subscription
* `/silver <silver> <account>` - give `silver` silver to the target account
* `/festival <festivalish>` - update the global festival data using festivalish (settings that can be changed are `GameSettings`, see below)

You also get access to some commands in-game:

* `@allegiance <allegiance>` - change your allegiance to `allegiance`. If `GM` is specified, then you will be non-hostle to everything, and they will be non-hostile to you
* `@gold <num>` - create <num> gold on your tile
* `@item <item name>` - create a particular item on your tile
* `@itemdupe` - copy your right hand to your left hand
* `@examine <nothing|npcish> <nothing|prop>` - if `npcish` is specified, will examine an npc (if `prop` is specified, it will print only that prop). Otherwise, it'll examine your right hand item
* `@itemforge propsish` - create an item using props syntax, for example: `sprite=1 type=Hammer stats.str=1`
* `@skill <skillname> <xpgain>` - gain `xpgain` skill for `skillname`
* `@tp <tpgain>` - gain `tpgain` trait points
* `@xp <xp>` - gain <xp> XP
* `@intercept <target>` - you will see log messages as this target (as well as your own).
* `@kill <target>` - will instantly kill `target`
* `@lootvortex <radius>` - pull every item in `radius` tiles to the current one
* `@itemmod propsish` - modify your rightHand item based on props specified, for example: `ounces=10`
* `@npcmod npcish propsish` - modify the npc based on propsish
* `@partyjoin partyname` - automatically join `partyname` if it exists, regardless of leader visibility
* `@respawn lairname` - respawn `lairname` on the current map
* `@searchitems itemname` - search all the items for itemname
* `@searchnpcs npcname` - search all the items for npcname
* `@spawnnpc npc.npcId="NPC Internal ID" spawner.*=*` - spawn a monster of the given id, with optional spawner props
* `@summon playerish` - summon any player who matches playerish
* `@teleport <x> <y> [map]` - teleport to X,Y, and if map is specified, you'll also change maps
* `@teleportto npcish` - teleport to an npc matching a name like npcish
* `@sight` - give yourself the ability to see through walls

#### Game Settings

Internally, there are a large handful of game settings that control how players gain anything. They are pretty self-explanatory:

* `xpMult` - the xp multiplier, default 1
* `skillMult` - the skill multiplier, default 1
* `goldMult` - the gold multiplier, default 1
* `numberOfRandomStatsForItems` - the number of random stats an item can generate with, default 0
* `randomStatMaxValue` - the max value a random stat can be on an item, default 0
* `randomStatChance` - the chance of an item generating with a random stat (1-1000000), default 0
