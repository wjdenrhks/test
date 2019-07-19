import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {
  Employee

} from "../..";


@Table({description: "주/야간 담당 관리자"})
export class ResponsibleManager {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "년"})
  public year!: number;

  @Column({description: "월"})
  public month!: number;

  @Column({description: "주"})
  public week!: number;

  @Column({description: "주/야간", nullable: true})
  public type?: "주간" | "야간";

  @Column({description: "담당자"})
  public managerId!: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("managerId", () => Employee, "담당자")
  public employee?: Employee;

  //------------------------------------

}