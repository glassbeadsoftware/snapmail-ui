"use strict";
/**
 * Defines AdminWebsocket, an easy-to-use websocket implementation of the
 * Conductor Admin API
 *
 *    const client = AdminWebsocket.connect(
 *      'ws://localhost:9000'
 *    )
 *
 *    client.generateAgentPubKey()
 *      .then(agentPubKey => {
 *        console.log('Agent successfully generated:', agentPubKey)
 *      })
 *      .catch(err => {
 *        console.error('problem generating agent:', err)
 *      })
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminWebsocket = void 0;
const client_1 = require("./client");
const common_1 = require("./common");
const common_2 = require("../api/common");
class AdminWebsocket {
    constructor(client) {
        this._requester = (tag, transformer) => common_2.requesterTransformer(req => this.client.request(req).then(common_1.catchError), tag, transformer);
        // the specific request/response types come from the Interface
        // which this class implements
        this.activateApp = this._requester('activate_app');
        this.attachAppInterface = this._requester('attach_app_interface');
        this.deactivateApp = this._requester('deactivate_app');
        this.dumpState = this._requester('dump_state', dumpStateTransform);
        this.generateAgentPubKey = this._requester('generate_agent_pub_key');
        this.installApp = this._requester('install_app');
        this.listDnas = this._requester('list_dnas');
        this.listCellIds = this._requester('list_cell_ids');
        this.listActiveApps = this._requester('list_active_apps');
        this.requestAgentInfo = this._requester('request_agent_info');
        this.addAgentInfo = this._requester('add_agent_info');
        this.client = client;
    }
    static connect(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const wsClient = yield client_1.WsClient.connect(url);
            return new AdminWebsocket(wsClient);
        });
    }
}
exports.AdminWebsocket = AdminWebsocket;
const dumpStateTransform = {
    input: (req) => req,
    output: (res) => {
        return JSON.parse(res);
    }
};
//# sourceMappingURL=admin.js.map