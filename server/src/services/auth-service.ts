import * as querystring from "querystring";
import fetch from "node-fetch";
import {UserProfileService} from "./user-profile-service";
import {IUser} from "../model/user-model";
import {CredentialService} from "./credential-service";
import {SpotifyBaseService} from "./spotify-base-service";
import {ConfigService} from "./config-service";

export class AuthService extends SpotifyBaseService {
    private readonly configService: ConfigService = new ConfigService();
    private readonly redirectUri = `${this.configService.server()}/callback`;
    private static readonly  endpoint = "https://accounts.spotify.com/authorize";
    private static readonly scope = "user-read-private user-read-email user-read-recently-played user-top-read playlist-modify-public";

    private readonly credentialService: CredentialService = new CredentialService();

    public buildUri(): string {
        const query = querystring.stringify({
            response_type: "code",
            client_id: this.credentialService.clientId(),
            scope: AuthService.scope,
            redirect_uri: this.redirectUri,
        });
        return AuthService.endpoint + "?" + query;
    }

    public requestSessionToken(code: string): Promise<IUser> {
        const formData = new URLSearchParams();
        formData.append("code", code);
        formData.append("redirect_uri", this.redirectUri);
        formData.append("grant_type", "authorization_code");
        return fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: this.credentialService.authorizationHeader(),
            body: formData
        })
            .then(res => {
                return res.json();
            })
            .then(token => {
                const userProfileService: UserProfileService = new UserProfileService()
                return userProfileService.createNewUser(token);
            });
    }
}