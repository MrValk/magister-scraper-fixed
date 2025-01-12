export interface OptionalData {
  name: string;
  value: any;
}

export interface LoginOptions {
  username: string;
  password: string;
}

export interface ChallengeResponse {
  /** School's name */
  tenantname: string;
  /** User's username (or ID) */
  username: string | null;
  /** User's email */
  useremail: string | null;
  /** Redirect URL. `null` if invalid data was provided */
  redirectURL: string | null;
  /** Error */
  error: string | null;
}

export interface RedirectQuery {
  access_token: string;
  "#id_token": string;
  session_state: string;
}

export interface AccountData {
  // There's more to it. It's just not relevant to me.
  Persoon: {
    Id: number;
  };
}

export interface InitOptions {
  /** User"s name. Often an ID */
  username: string;
  /** User"s password */
  password: string;
  /** School domain */
  hostname: string;
}

export interface ExpandedOptions extends InitOptions {
  /** Main authority string */
  authority: string;
  /** Endpoints to use */
  endpoints: any;
}
