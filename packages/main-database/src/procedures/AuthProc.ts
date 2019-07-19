import {IAuthInfo} from "../common/IAuthInfo";
import {sorm} from "@simplism/orm-query";
import {DateTime, JsonConvert} from "@simplism/core";
import {MainDbContext} from "../MainDbContext";

export class AuthProc {
  public static async loginAsync(db: MainDbContext, authId: number): Promise<IAuthInfo | undefined>;
  public static async loginAsync(db: MainDbContext, companyName: string, loginId: string, encryptedPassword: string): Promise<IAuthInfo | undefined>;
  public static async loginAsync(db: MainDbContext, arg1: string | number, arg2?: string, arg3?: string): Promise<IAuthInfo | undefined> {
    const authId = typeof arg1 === "number" ? arg1 : undefined;
    const companyName = typeof arg1 === "string" ? arg1 : undefined;
    const loginId = arg2;
    const encryptedPassword = arg3;

    /* 유효기간없음
    await db.auth
      .where(item => [
        sorm.lessThen(item.createdAtDateTime, new DateTime().addHours(-1))
      ])
      .deleteAsync();*/

    let employeeId: number | undefined;
    if (authId) {
      const auth = await db.auth
        .where(item => [sorm.equal(item.id, authId)])
        .singleAsync();

      if (!auth) return;

      employeeId = auth.employeeId;
    }

    let queryable = db.employee
      .include(item => item.company)
      .include(item => item.company!.configs)
      .include(item => item.userGroup)
      .include(item => item.userGroup!.permissions);

    if (employeeId) {
      queryable = queryable.where(item => [
        sorm.equal(item.id, employeeId)
      ]);
    }
    else {
      queryable = queryable.where(item => [
        sorm.equal(item.company!.name, companyName),
        sorm.equal(item.userId, loginId),
        sorm.equal(item.encryptedPassword, encryptedPassword),
        sorm.equal(item.isDisabled, false)
      ]);
    }

    const authInfo = await queryable
      .select(item => ({
        employeeId: item.id!,
        employeeName: item.name,
        employeeLoginId: item.userId,
        employeeErpSync: item.code!,
        companyId: item.companyId,
        companyName: item.company!.name,
        companyConfig: item.company!.configs!.map(item1 => ({
          code: item1.code,
          valueJson: item1.valueJson
        })),
        permissions: item.userGroup!.permissions!.map(item1 => ({
          code: item1.code,
          valueJson: item1.valueJson
        }))
      }))
      .singleAsync();

    if (!authInfo) return;

    const result = {
      ...Object.clone(authInfo, {excludeProps: ["companyConfig", "permissions"]}),
      companyConfig: {},
      permissions: {}
    };

    for (const companyConfigItem of authInfo.companyConfig || []) {
      result.companyConfig[companyConfigItem.code] = JsonConvert.parse(companyConfigItem.valueJson);
    }

    for (const companyConfigItem of authInfo.permissions || []) {
      result.permissions[companyConfigItem.code] = JsonConvert.parse(companyConfigItem.valueJson);
    }

    await db.auth
      .where(item => [sorm.equal(item.id, authId)])
      .updateAsync(() => ({
        createdAtDateTime: new DateTime()
      }));

    return result;
  }
}