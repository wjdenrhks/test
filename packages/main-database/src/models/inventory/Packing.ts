import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Employee} from "../base-info/Employee";
import {DateTime} from "@simplism/core";
import {PackingItem} from "../..";

@Table({description: "포장 팔레트"})
export class Packing {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "팔레트바코드"})
  public paletteBarcode!: string;

  @Column({description: "바코드 순서"})
  public codeSeq?: number;

  @Column({description: "출력여부", nullable: true})
  public isPrinting?: boolean;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  @Column({description: "등록사원"})
  public createdByEmployeeId!: number;

  @Column({description: "사용안합"})
  public isDisabled!: boolean;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("createdByEmployeeId", () => Employee, "처리사원")
  public employee?: Employee;


  //------------------------------------

  @ForeignKeyTarget(() => PackingItem, "packing", "팔레트별 LOT")
  public packingItems?: PackingItem[];
}