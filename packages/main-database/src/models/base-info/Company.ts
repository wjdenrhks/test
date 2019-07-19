import {Column, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {CompanyConfig} from "./CompanyConfig";

@Table({description: "회사"})
export class Company {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "명칭"})
  public name!: string;

  //------------------------------------

  @ForeignKeyTarget(() => CompanyConfig, "company", "설정 목록")
  public configs?: CompanyConfig[];
}