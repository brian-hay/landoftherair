"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const npc_loader_1 = require("../../../../helpers/npc-loader");
const common_responses_1 = require("../../common-responses");
exports.setup = (npc) => __awaiter(this, void 0, void 0, function* () {
    npc.hostility = 'Never';
    const vendorItems = [
        'Antanian Tunic',
        'Antanian Studded Tunic',
        'Antanian Scalemail Tunic',
        'Antanian Ringmail Tunic',
        'Antanian Breastplate',
        'Antanian Cloak',
        'Leather Ring'
    ];
    npc_loader_1.NPCLoader.loadVendorItems(npc, vendorItems);
    npc.rightHand = yield npc_loader_1.NPCLoader.loadItem('Antanian Longsword');
    npc.gear.Armor = yield npc_loader_1.NPCLoader.loadItem('Antanian Breastplate');
    npc.recalculateStats();
});
exports.responses = (npc) => {
    common_responses_1.VendorResponses(npc);
};
//# sourceMappingURL=armor-vendor.js.map