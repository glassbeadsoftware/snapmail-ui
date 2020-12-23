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
import * as Api from '../api/admin';
import { WsClient } from './client';
import { Transformer, Requester } from '../api/common';
export declare class AdminWebsocket implements Api.AdminApi {
    client: WsClient;
    constructor(client: WsClient);
    static connect(url: string): Promise<AdminWebsocket>;
    _requester: <ReqO, ReqI, ResI, ResO>(tag: string, transformer?: Transformer<ReqO, ReqI, ResI, ResO> | undefined) => (req: ReqO) => Promise<ResO>;
    activateApp: Requester<Api.ActivateAppRequest, Api.ActivateAppResponse>;
    attachAppInterface: Requester<Api.AttachAppInterfaceRequest, Api.AttachAppInterfaceResponse>;
    deactivateApp: Requester<Api.DeactivateAppRequest, Api.DeactivateAppResponse>;
    dumpState: Requester<Api.DumpStateRequest, Api.DumpStateResponse>;
    generateAgentPubKey: Requester<Api.GenerateAgentPubKeyRequest, Api.GenerateAgentPubKeyResponse>;
    installApp: Requester<Api.InstallAppRequest, Api.InstallAppResponse>;
    listDnas: Requester<Api.ListDnasRequest, Api.ListDnasResponse>;
    listCellIds: Requester<Api.ListCellIdsRequest, Api.ListCellIdsResponse>;
    listActiveApps: Requester<Api.ListActiveAppsRequest, Api.ListActiveAppsResponse>;
    requestAgentInfo: Requester<Api.RequestAgentInfoRequest, Api.RequestAgentInfoResponse>;
    addAgentInfo: Requester<Api.AddAgentInfoRequest, Api.AddAgentInfoResponse>;
}