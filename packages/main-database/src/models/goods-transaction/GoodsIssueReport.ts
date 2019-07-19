import {Column, Table} from "@simplism/orm-query";

@Table({description: "납기 미납사유 및 비고"})
export class GoodsIssueReport {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "년"})
  public year!: number;

  @Column({description: "월"})
  public month!: number;

  @Column({description: "주차"})
  public week!: number;

  @Column({description: "미납사유", nullable: true})
  public noPaymentRemark?: string;

  @Column({description: "비고", nullable: true})
  public remark?: string;

  //------------------------------------

  //------------------------------------

}