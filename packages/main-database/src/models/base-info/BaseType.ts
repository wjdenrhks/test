import {Company} from "./Company";
import {Column, ForeignKey, Table} from "@simplism/orm-query";

@Table({description: "기초구분"})
export class BaseType {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "구분"})
  public type!: string;

  @Column({description: "명칭"})
  public name!: string;

  @Column({description: "표시순번", nullable: true})
  public displayOrder?: number;

  @Column({description: "사용중지여부"})
  public isDisabled!: boolean;

  @Column({description: "비고", nullable: true})
  public remark?: string;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;
}