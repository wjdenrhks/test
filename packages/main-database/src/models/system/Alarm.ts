import {Company} from "../base-info/Company";
import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {DateTime} from "@simplism/core";
import {Employee} from "../base-info/Employee";

@Table({description: "알람"})
export class Alarm {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "받을사원 아이디"})
  public employeeId!: number;

  @Column({description: "구분"})
  public category!: string;

  @Column({description: "작업"})
  public task!: string;

  @Column({description: "관련항목 아이디", nullable: true})
  public relatedItemId?: number;

  @Column({description: "원인제공사원 아이디"})
  public createdByEmployeeId!: number;

  @Column({description: "등록일시"})
  public createdAtDateTime!: DateTime;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("employeeId", () => Employee, "받을사원")
  public employee?: Employee;

  @ForeignKey("createdByEmployeeId", () => Employee, "원인제공사원")
  public createdByEmployee?: Employee;
}