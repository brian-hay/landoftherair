
import * as colyseus from 'colyseus';
import * as http from 'http';
import * as express from 'express';
import * as cors from 'cors';
import * as staticFile from 'connect-static-file';

import * as Rooms from './rooms';

import * as recurse from 'recursive-readdir';
import * as path from 'path';
import * as processStats from 'process-stats';

import { DB } from './database';
import { Logger } from './logger';

import { drawNormal as drawNormalArmor } from './tasks/analysis/_armor';
import { drawNormal as drawNormalWeapon, drawSpecial as drawSpecialWeapon } from './tasks/analysis/_weapons';

class GameAPI {

  public isReady: Promise<any>;

  constructor() {
    this.isReady = new Promise(resolve => {
      const app = express();
      app.use(cors());

      app.use('/logs', async (req, res) => {
        const dbLogs = await DB.$logs.find().toArray();
        res.json(dbLogs);
      });

      app.use('/server', (req, res) => {
        res.json(processStats());
      });

      app.use('/item-stats', async (req, res) => {
        const statStrings = await Promise.all([drawNormalArmor(), drawNormalWeapon(), drawSpecialWeapon()]);
        res.send(statStrings.map(x => `<pre>${x}</pre>`).join(''))
      });

      app.use('/silent-dev', staticFile(`${__dirname}/silent-dev.html`));

      app.use('/silent-production', staticFile(`${__dirname}/silent-production.html`));

      app.use('/maps', express.static(require('path').join(__dirname, 'maps')));

      const port = process.env.PORT || 3303;

      const server = http.createServer(app);
      const gameServer = new colyseus.Server({ server });

      gameServer.register('Lobby', Rooms.Lobby);

      const allMapNames = {};

      recurse(`${__dirname}/maps`).then(files => {
        files.forEach(file => {
          const mapName = path.basename(file, path.extname(file));
          allMapNames[mapName] = true;
          gameServer.register(mapName, Rooms.GameWorld, { mapName, mapPath: file, allMapNames });
        });
      });

      server.listen(port);
      Logger.log(`Started server on port ${port}`);
      resolve();
    });
  }
}

export const API = new GameAPI();
