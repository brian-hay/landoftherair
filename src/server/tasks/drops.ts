
const argv = require('minimist')(process.argv.slice(2));
require('dotenv').config({ silent: true, path: argv.prod ? '.env.prod' : '.env' });

import { DB } from '../database';

import * as YAML from 'yamljs';
import * as recurse from 'recursive-readdir';
import * as path from 'path';

import { flatten } from 'lodash';

class DropsLoader {

  static async loadAllRegions() {
    await DB.init();
    await DB.$regionDrops.remove({}, { multi: true });

    return new Promise(resolve => {

      const globalDroptable = YAML.load(`${__dirname}/../../content/droptables/Global.yml`);

      recurse(`${__dirname}/../../content/droptables/regions`).then(files => {
        const filePromises = files.map(file => {
          const droptable = YAML.load(file);

          const fileName = path.basename(file, path.extname(file));
          console.log(`Inserting Region ${fileName}`);

          return DB.$regionDrops.insert({
            regionName: fileName,
            drops: droptable.concat(globalDroptable)
          });
        });

        Promise.all(flatten(filePromises)).then(() => {
          console.log('Regions - Done');
          resolve();
        });
      });
    });
  }

  static async loadAllMaps() {
    await DB.init();
    await DB.$mapDrops.remove({}, { multi: true });

    return new Promise(resolve => {

      recurse(`${__dirname}/../../content/droptables/maps`).then(files => {
        const filePromises = files.map(file => {
          const droptable = YAML.load(file);
          const fileName = path.basename(file, path.extname(file));
          console.log(`Inserting Map ${fileName}`);

          return DB.$mapDrops.insert({
            mapName: fileName,
            drops: droptable
          });
        });

        Promise.all(flatten(filePromises)).then(() => {
          console.log('Maps - Done');
          resolve();
        });
      });
    });
  }

}

Promise.all([DropsLoader.loadAllRegions(), DropsLoader.loadAllMaps()])
  .then(() => {
    process.exit(0);
  });
