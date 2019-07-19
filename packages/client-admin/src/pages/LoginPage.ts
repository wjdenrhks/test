import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Router} from "@angular/router";
import {AppDataProvider} from "@sample/client-common";
import {SdLocalStorageProvider, SdOrmProvider, SdSocketProvider, SdToastProvider} from "@simplism/angular";
import {DateTime} from "@simplism/core";
import {AuthProc, MainDbContext, MySqlProc} from "@sample/main-database";
import {Md5} from "ts-md5";

@Component({
  selector: "app-login",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="min-height: 100%; width: 100%;" class="sd-background-bluegrey-darker">
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <div style="width: 320px; margin: 0 auto;">
        <div style="text-align: center;">
          <!--<img [src]="logo" style="text-align: center; width: 240px;">-->
          <h1> 삼성그라테크 MES</h1>
        </div>
        <br/>
        <br/>
        <br/>
        <sd-busy-container [busy]="busy">
          <sd-form (submit)="onFormSubmit()">
            <sd-form-item [label]="'아이디'">
              <sd-textfield [required]="true"
                            [(value)]="formData.employeeId"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'비밀번호'">
              <sd-textfield [type]="'password'"
                            [required]="true"
                            [(value)]="formData.password"></sd-textfield>
            </sd-form-item>
            <sd-form-item>
              <sd-button [type]="'submit'" [theme]="'primary'" [size]="'lg'">
                <sd-icon [icon]="'check'" [fixedWidth]="true"></sd-icon>
                로그인
              </sd-button>
            </sd-form-item>
          </sd-form>
        </sd-busy-container>
      </div>
    </div>`
})
export class LoginPage {
  public logo = require("../assets/logo.png"); //tslint:disable-line:no-require-imports

  public formData: {
    companyName?: string;
    employeeId?: string;
    password?: string;
  } = process.env.NODE_ENV !== "production"
    ? {
      companyName: "삼성그라테크",
      employeeId: "master",
      password: "1234"
    }
    : {
      ...this._localStorage.get("lastLoginFormData")
    };

  public busy = false;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _router: Router,
                     private readonly _appData: AppDataProvider,
                     private readonly _socket: SdSocketProvider,
                     private readonly _localStorage: SdLocalStorageProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async onFormSubmit(): Promise<void> {
    this.busy = true;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        // 사용자 정보 sync
        await MySqlProc.syncEmployees(db, this._socket);

        const authInfo = await AuthProc.loginAsync(
          db,
          "삼성그라테크",
          this.formData.employeeId!,
          String(new Md5().appendStr(this.formData.password!).end())
        );

        if (!authInfo) {
          throw new Error("사원 정보를 찾을 수 없습니다.");
        }
        this._appData.authInfo = authInfo;

        const auth = await db.auth.insertAsync({
          employeeId: authInfo.employeeId,
          createdAtDateTime: new DateTime()
        });
        this._localStorage.set("authId", auth.id);
        this._localStorage.set("lastLoginFormData", {
          companyName: "삼성그라테크",
          employeeId: this.formData.employeeId
        });

        this.busy = false;
        await this._router.navigate(["/home/main"]);
      });
    }
    catch (err) {
      this.busy = false;
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this._cdr.markForCheck();
  }
}
