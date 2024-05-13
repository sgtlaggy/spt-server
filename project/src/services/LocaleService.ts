import { inject, injectable } from "tsyringe";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { ILocaleConfig } from "@spt-aki/models/spt/config/ILocaleConfig";
import { ILocaleBase } from "@spt-aki/models/spt/server/ILocaleBase";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";

/**
 * Handles getting locales from config or users machine
 */
@injectable()
export class LocaleService
{
    protected localeConfig: ILocaleConfig;
    protected localesTable: ILocaleBase;

    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("DatabaseServer") protected databaseServer: DatabaseServer,
        @inject("ConfigServer") protected configServer: ConfigServer,
    )
    {
        this.localeConfig = this.configServer.getConfig(ConfigTypes.LOCALE);
        this.localesTable = this.databaseServer.getTables().locales;
    }

    /**
     * Get the eft globals db file based on the configured locale in config/locale.json, if not found, fall back to 'en'
     * @returns dictionary
     */
    public getLocaleDb(): Record<string, string>
    {
        const desiredLocale = this.localesTable.global[this.getDesiredGameLocale()];
        if (desiredLocale)
        {
            return desiredLocale;
        }

        this.logger.warning(
            `Unable to find desired locale file using locale: ${this.getDesiredGameLocale()} from config/locale.json, falling back to 'en'`,
        );

        return this.localesTable.global.en;
    }

    /**
     * Gets the game locale key from the locale.json file,
     * if value is 'system' get system locale
     * @returns locale e.g en/ge/cz/cn
     */
    public getDesiredGameLocale(): string
    {
        if (this.localeConfig.gameLocale.toLowerCase() === "system")
        {
            return this.getPlatformForClientLocale();
        }

        return this.localeConfig.gameLocale.toLowerCase();
    }

    /**
     * Gets the game locale key from the locale.json file,
     * if value is 'system' get system locale
     * @returns locale e.g en/ge/cz/cn
     */
    public getDesiredServerLocale(): string
    {
        if (this.localeConfig.serverLocale.toLowerCase() === "system")
        {
            return this.getPlatformForServerLocale();
        }

        return this.localeConfig.serverLocale.toLowerCase();
    }

    /**
     * Get array of languages supported for localisation
     * @returns array of locales e.g. en/fr/cn
     */
    public getServerSupportedLocales(): string[]
    {
        return this.localeConfig.serverSupportedLocales;
    }

    /**
     * Get array of languages supported for localisation
     * @returns array of locales e.g. en/fr/cn
     */
    public getLocaleFallbacks(): { [locale: string]: string }
    {
        return this.localeConfig.fallbacks;
    }

    /**
     * Get the full locale of the computer running the server lowercased e.g. en-gb / pt-pt
     * @returns string
     */
    protected getPlatformForServerLocale(): string
    {
        const platformLocale = this.getPlatformLocale();
        if (!platformLocale)
        {
            this.logger.warning("System language could not be found, falling back to english");

            return "en";
        }

        const baseNameCode = platformLocale.baseName.toLowerCase();
        if (!this.localeConfig.serverSupportedLocales.includes(baseNameCode))
        {
            // Chek if base language (e.g. CN / EN / DE) exists
            const languageCode = platformLocale.language.toLocaleLowerCase();
            if (this.localeConfig.serverSupportedLocales.includes(languageCode))
            {
                return languageCode;
            }

            this.logger.warning(`Unsupported system language found: ${baseNameCode}, falling back to english`);

            return "en";
        }

        return baseNameCode;
    }

    /**
     * Get the locale of the computer running the server
     * @returns langage part of locale e.g. 'en' part of 'en-US'
     */
    protected getPlatformForClientLocale(): string
    {
        const platformLocale = this.getPlatformLocale();
        if (!platformLocale)
        {
            this.logger.warning("System language could not be found, falling back to english");
            return "en";
        }

        const baseNameCode = platformLocale.baseName?.toLocaleLowerCase();
        if (baseNameCode && this.localesTable.global[baseNameCode])
        {
            return baseNameCode;
        }

        const languageCode = platformLocale.language?.toLowerCase();
        if (languageCode && this.localesTable.global[languageCode])
        {
            return languageCode;
        }

        const regionCode = platformLocale.region?.toLocaleLowerCase();
        if (regionCode && this.localesTable.global[regionCode])
        {
            return regionCode;
        }

        // BSG map DE to GE some reason
        if (platformLocale.language === "de")
        {
            return "ge";
        }

        this.logger.warning(`Unsupported system language found: ${languageCode}, falling back to english`);
        return "en";
    }

    /**
     * This is in a function so we can overwrite it during testing
     * @returns The current platform locale
     */
    protected getPlatformLocale(): Intl.Locale
    {
        return new Intl.Locale(Intl.DateTimeFormat().resolvedOptions().locale);
    }
}
