import {Injectable} from "@angular/core";
import {IAuthInfo} from "@sample/main-database";

@Injectable()
export class AppDataProvider {
  public authInfo?: IAuthInfo;
}