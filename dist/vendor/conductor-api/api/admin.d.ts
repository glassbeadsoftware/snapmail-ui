import { Requester } from "./common";
import { AgentPubKey, MembraneProof, DnaProperties, InstalledAppId, CellId, CellNick, InstalledApp } from "./types";
export declare type ActivateAppRequest = {
    installed_app_id: InstalledAppId;
};
export declare type ActivateAppResponse = null;
export declare type AttachAppInterfaceRequest = {
    port: number;
};
export declare type AttachAppInterfaceResponse = {
    port: number;
};
export declare type DeactivateAppRequest = {
    installed_app_id: InstalledAppId;
};
export declare type DeactivateAppResponse = null;
export declare type DumpStateRequest = {
    cell_id: CellId;
};
export declare type DumpStateResponse = any;
export declare type GenerateAgentPubKeyRequest = void;
export declare type GenerateAgentPubKeyResponse = AgentPubKey;
export declare type InstallAppRequest = {
    installed_app_id: InstalledAppId;
    agent_key: AgentPubKey;
    dnas: Array<InstallAppDnaPayload>;
};
export declare type InstallAppResponse = InstalledApp;
export declare type ListDnasRequest = void;
export declare type ListDnasResponse = Array<string>;
export declare type ListCellIdsRequest = void;
export declare type ListCellIdsResponse = Array<CellId>;
export declare type ListActiveAppsRequest = void;
export declare type ListActiveAppsResponse = Array<InstalledAppId>;
export declare type AgentInfoSigned = any;
export declare type RequestAgentInfoRequest = {
    cell_id: CellId | null;
};
export declare type RequestAgentInfoResponse = Array<AgentInfoSigned>;
export declare type AddAgentInfoRequest = {
    agent_infos: Array<AgentInfoSigned>;
};
export declare type AddAgentInfoResponse = any;
export interface AdminApi {
    activateApp: Requester<ActivateAppRequest, ActivateAppResponse>;
    attachAppInterface: Requester<AttachAppInterfaceRequest, AttachAppInterfaceResponse>;
    deactivateApp: Requester<DeactivateAppRequest, DeactivateAppResponse>;
    dumpState: Requester<DumpStateRequest, DumpStateResponse>;
    generateAgentPubKey: Requester<GenerateAgentPubKeyRequest, GenerateAgentPubKeyResponse>;
    installApp: Requester<InstallAppRequest, InstallAppResponse>;
    listDnas: Requester<ListDnasRequest, ListDnasResponse>;
    listCellIds: Requester<ListCellIdsRequest, ListCellIdsResponse>;
    listActiveApps: Requester<ListActiveAppsRequest, ListActiveAppsResponse>;
    requestAgentInfo: Requester<RequestAgentInfoRequest, RequestAgentInfoResponse>;
    addAgentInfo: Requester<AddAgentInfoRequest, AddAgentInfoResponse>;
}
declare type InstallAppDnaPayload = {
    path: string;
    nick: CellNick;
    properties?: DnaProperties;
    membrane_proof?: MembraneProof;
};
export {};