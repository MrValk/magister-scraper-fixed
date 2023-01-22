/**
 * A fixed version of JipFr's Magister 6 scraper, which is now broken due to changes in the HTML of the Magister login page.
 * All code belongs to their respective owners, I just fixed it up a bit.
 */
import { CookieJar } from "tough-cookie";
import { ExpandedOptions, InitOptions } from "./types";
export default class Magister {
    authority: string;
    hostname: string;
    userId: number;
    endpoints: {
        issuer: string;
        jwks_uri: string;
        authorization_endpoint: string;
        token_endpoint: string;
        userinfo_endpoint: string;
        end_session_endpoint: string;
        check_session_iframe: string;
        revocation_endpoint: string;
        [key: string]: string;
    };
    clientId: string; /** Always M6-hostname */
    redirectUri: string;
    responseType: string;
    scope: string;
    acrValues: string;
    sessionId: string;
    cookieJar: CookieJar;
    defaultState: string;
    defaultNonce: string;
    accessToken: string;
    constructor(options: ExpandedOptions);
    static new(options: InitOptions): Promise<Magister>;
    private getQuery;
    private login;
    private submitChallenge;
    private initCookies;
    get(url: string): Promise<any>;
}
//# sourceMappingURL=index.d.ts.map