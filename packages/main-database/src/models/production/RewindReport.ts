import {Column, Table} from "@simplism/orm-query";

@Table({description: "리와인더 현황 정보"})
export class RewindReport {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "실적타입(1:월별실적, 0:목표실적)"})
  public planType!: boolean;

  @Column({description: "년"})
  public year!: number;

  @Column({description: "월"})
  public month!: number;

  @Column({description: "비고", nullable: true})
  public remark?: string;

  //------------------------------------

  //------------------------------------

}