import { CustomizationController } from "@spt/controllers/CustomizationController";
import type { IEmptyRequestData } from "@spt/models/eft/common/IEmptyRequestData";
import type { IPmcData } from "@spt/models/eft/common/IPmcData";
import type { ISuit } from "@spt/models/eft/common/tables/ITrader";
import type { IBuyClothingRequestData } from "@spt/models/eft/customization/IBuyClothingRequestData";
import type { IGetSuitsResponse } from "@spt/models/eft/customization/IGetSuitsResponse";
import type { IWearClothingRequestData } from "@spt/models/eft/customization/IWearClothingRequestData";
import type { ICustomizationSetRequest } from "@spt/models/eft/customization/iCustomizationSetRequest";
import type { IGetBodyResponseData } from "@spt/models/eft/httpResponse/IGetBodyResponseData";
import type { IItemEventRouterResponse } from "@spt/models/eft/itemEvent/IItemEventRouterResponse";
import { SaveServer } from "@spt/servers/SaveServer";
import { HttpResponseUtil } from "@spt/utils/HttpResponseUtil";
import { inject, injectable } from "tsyringe";
import type { ICustomisationStorage } from "../models/eft/common/tables/ICustomisationStorage";

@injectable()
export class CustomizationCallbacks {
    constructor(
        @inject("CustomizationController") protected customizationController: CustomizationController,
        @inject("SaveServer") protected saveServer: SaveServer,
        @inject("HttpResponseUtil") protected httpResponse: HttpResponseUtil,
    ) {}

    /**
     * Handle client/trading/customization/storage
     * @returns IGetSuitsResponse
     */
    public getSuits(url: string, info: IEmptyRequestData, sessionID: string): IGetBodyResponseData<IGetSuitsResponse> {
        const result: IGetSuitsResponse = { _id: sessionID, suites: this.saveServer.getProfile(sessionID).suits };
        return this.httpResponse.getBody(result);
    }

    /**
     * Handle client/trading/customization
     * @returns ISuit[]
     */
    public getTraderSuits(url: string, info: IEmptyRequestData, sessionID: string): IGetBodyResponseData<ISuit[]> {
        const splittedUrl = url.split("/");
        const traderID = splittedUrl[splittedUrl.length - 3];

        return this.httpResponse.getBody(this.customizationController.getTraderSuits(traderID, sessionID));
    }

    /**
     * Handle CustomizationWear event
     */
    public wearClothing(
        pmcData: IPmcData,
        body: IWearClothingRequestData,
        sessionID: string,
    ): IItemEventRouterResponse {
        return this.customizationController.wearClothing(pmcData, body, sessionID);
    }

    /**
     * Handle CustomizationBuy event
     */
    public buyClothing(pmcData: IPmcData, body: IBuyClothingRequestData, sessionID: string): IItemEventRouterResponse {
        return this.customizationController.buyClothing(pmcData, body, sessionID);
    }

    public getHideoutCustomisation(url: string, info: any, sessionID: string): IGetBodyResponseData<any> {
        return this.httpResponse.getBody(this.customizationController.getHideoutCustomisation(sessionID, info));
    }

    public getStorage(url: string, info: any, sessionID: string): IGetBodyResponseData<ICustomisationStorage> {
        return this.httpResponse.getBody(this.customizationController.getCustomisationStoage(sessionID, info));
    }

    /** Handle CustomizationSet */
    public async setClothing(
        pmcData: IPmcData,
        info: ICustomizationSetRequest,
        sessionID: string,
    ): Promise<IGetBodyResponseData<any>> {
        return this.httpResponse.getBody(await this.customizationController.setClothing(sessionID, info, pmcData));
    }
}
