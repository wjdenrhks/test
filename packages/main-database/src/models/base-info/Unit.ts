import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "./Company";

@Table({description: "단위"})
export class Unit {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "구분(길이, 중량, 수량"})
  public type!: string;

  @Column({description: "명칭"})
  public name!: string;

  @Column({description: "심볼(ea, m, g"})
  public symbol!: string;

  @Column()
  public isDisabled!: boolean;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;
}