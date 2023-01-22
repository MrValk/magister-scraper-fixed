/**
 * A fixed version of JipFr's Magister 6 scraper, which is now broken due to changes in the HTML of the Magister login page.
 * All code belongs to their respective owners, I just fixed it up a bit.
 */

/**
 * Big thanks to Red (https://github.com/RedDuckss) for researching a lot of the endpoints and helping me out big-time
 */

import got from "got";
import * as url from "url";
import { CookieJar } from "tough-cookie";
import {
  AccountData,
  ChallengeResponse,
  LoginOptions,
  RedirectQuery,
  ExpandedOptions,
  InitOptions,
  OptionalData,
} from "./types";

// Generate URL with query parameters
function genUrl(base: string, params = {}) {
  const items = [];
  for (const k in params) {
    // @ts-ignore
    items.push(`${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`);
  }
  return items.length > 0 ? `${base}?${items.join("&")}` : base;
}

export default class Magister {
  // Lots of basic types...
  public authority: string;
  public hostname: string;

  public userId: number = 0;

  public endpoints: {
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
  public clientId: string; /** Always M6-hostname */
  public redirectUri: string;
  public responseType: string;
  public scope: string;
  public acrValues: string;
  public sessionId: string = "";
  public cookieJar: CookieJar;
  public defaultState: string;
  public defaultNonce: string;
  public accessToken: string = "";

  constructor(options: ExpandedOptions) {
    this.authority = options.authority;
    this.endpoints = options.endpoints;
    this.hostname = options.hostname;

    this.defaultState = "0".repeat(32);
    this.defaultNonce = "0".repeat(32);

    this.clientId = `M6-${this.hostname}`;
    this.redirectUri = `https://${this.hostname}/oidc/redirect_callback.html`;
    this.responseType = "id_token token";
    this.scope = "openid profile";
    this.acrValues = `tenant:${this.hostname}`;

    this.cookieJar = new CookieJar();
  }

  static async new(options: InitOptions) {
    let authority = "https://accounts.magister.net";

    // ! Get endpoints
    let endpointUrl = `${authority}/.well-known/openid-configuration`;
    let endpoints = await got(endpointUrl).json();

    // ! Generate client
    let clientOptions = {
      ...options,
      authority,
      endpoints,
    };
    let client = new Magister(clientOptions);

    // ! Initialize session cookies
    await client.initCookies();

    // ! Generate login values and such
    await client.login({
      username: options.username,
      password: options.password,
    });

    // ! Get ID and such for the user
    let userData: AccountData = await client.get(
      `https://${options.hostname}/api/account?noCache=0`
    );

    client.userId = userData.Persoon.Id;

    return client;
  }

  private getQuery() {
    // I thought I'd move this chunk into its own method instead of plopping it down everywhere
    return {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: this.responseType,
      scope: this.scope,
      acr_values: this.acrValues,
      state: this.defaultState,
      nonce: this.defaultNonce,
    };
  }

  private async login(loginOptions: LoginOptions) {
    await this.submitChallenge("current");
    await this.submitChallenge("username", {
      name: "username",
      value: loginOptions.username,
    });

    // ! Submit password
    let passwordRes = await this.submitChallenge("password", {
      name: "password",
      value: loginOptions.password,
    });

    // Verify password is valid
    if (!passwordRes.redirectURL)
      throw new Error(
        `[MAGISTER ERROR] No redirect URL was received. This likely means the credentials are incorrect. Error: ${passwordRes.error}`
      );

    // ! Extract cookies, session IDs, etc.
    // Get headers and such from the redirect URL.
    const redirectUrl = `${this.authority}${passwordRes.redirectURL}`;
    const redirectRes = await got(redirectUrl, {
      cookieJar: this.cookieJar,
      throwHttpErrors: false,
      followRedirect: false,
    });

    // Get hash
    if (!redirectRes.headers.location)
      throw new Error("[magister-scraper] incorrect url");
    const { hash } = url.parse(redirectRes.headers.location);
    if (!hash) throw new Error("[magister-scraper] incorrect url");

    // Parse hash
    const query = hash.split("&").reduce((acc, curr) => {
      let v = curr.split("=");
      //@ts-ignore
      acc[v[0]] = v[1];
      return acc;
    }, {}) as RedirectQuery;

    // Set fields
    this.accessToken = query.access_token;
  }

  private async submitChallenge(
    name: string,
    optionalData: OptionalData | null = null
  ): Promise<ChallengeResponse> {
    try {
      const jar = this.cookieJar.toJSON();
      //@ts-ignore
      const XSRFToken = jar.cookies.find(
        (cookie) => cookie.key === "XSRF-TOKEN"
      ).value;

      const headers = {
        "content-type": "application/json",
        "x-xsrf-token": XSRFToken,
      };

      const returnUrl = genUrl("/connect/authorize/callback", this.getQuery());

      const postData = {
        sessionId: this.sessionId,
        returnUrl,
      };

      if (optionalData) {
        //@ts-ignore
        postData[optionalData.name] = optionalData.value;
      }

      const challengeUrl = `${this.authority}/challenges/${name}`;

      return await got
        .post(challengeUrl, {
          cookieJar: this.cookieJar,
          headers,
          throwHttpErrors: false,
          json: postData,
        })
        .json();
    } catch (err) {
      if (optionalData)
        throw new Error(`[magister-scraper] incorrect ${optionalData.name}`);
      else
        throw new Error(`[magister-scraper] something went wrong during login`);
    }
  }

  private async initCookies() {
    const cookieUrl = genUrl(
      this.endpoints.authorization_endpoint,
      this.getQuery()
    );

    const response = await got(cookieUrl, {
      cookieJar: this.cookieJar,
    });

    this.sessionId = url.parse(response.url, true).query.sessionId as string;
  }

  async get(url: string): Promise<any> {
    return await got(url, {
      cookieJar: this.cookieJar,
      headers: {
        authorization: `Bearer ${this.accessToken}`,
      },
    }).json();
  }
}
