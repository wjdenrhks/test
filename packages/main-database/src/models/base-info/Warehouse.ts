import {Company} from "./Company";
import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {BaseType} from "./BaseType";

@Table({description: "창고"})
export class Warehouse {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "구분"})
  public typeId!: number;

  @Column({description: "명칭"})
  public name!: string;

  @Column({description: "등급"})
  public rating!: "A" | "B" | "C" | "공통";

  @Column({description: "사용중지여부"})
  public isDisabled!: boolean;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("typeId", () => BaseType, "창고명칭")
  public type?: BaseType;
}