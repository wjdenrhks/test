import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Employee} from "../base-info/Employee";
import {DateTime} from "@simplism/core";

@Table({description: "인증"})
export class Auth {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "사원 아이디"})
  public employeeId!: number;

  @Column({description: "인증일시"})
  public createdAtDateTime!: DateTime;

  //------------------------------------

  @ForeignKey("employeeId", () => Employee)
  public employee?: Employee;
}