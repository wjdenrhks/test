import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "./Company";

@Table({description: "회사설정"})
export class CompanyConfig {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "코드"})
  public code!: string;

  @Column({description: "JSON 값", dataType: "NVARCHAR(MAX)"})
  public valueJson!: string;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;
}