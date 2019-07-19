import {Company} from "./Company";
import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {UserGroupPermission} from "./UserGroupPermission";
import {Employee} from "./Employee";

@Table({description: "사용자그룹"})
export class UserGroup {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "명칭"})
  public name!: string;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  //------------------------------------
  @ForeignKeyTarget(() => UserGroupPermission, "userGroup", "권한 목록")
  public permissions?: UserGroupPermission[];

  @ForeignKeyTarget(() => Employee, "userGroup", "사용자 목록")
  public employee?: Employee[];
}