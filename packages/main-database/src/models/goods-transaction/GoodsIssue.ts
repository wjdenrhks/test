import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {DateOnly, DateTime} from "@simplism/core";
import {Company, Employee, Goods, GoodsIssueGoods, Partner} from "../..";
import {GoodsIssuePlan} from "./GoodsIssuePlan";

@Table({description: "출고"})
export class GoodsIssue {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "출하일"})
  public issueDate!: DateOnly;

  @Column({description: "출고구분", nullable: true})
  public issueType?: "출하" | "리와인더" | "외주 임가공";

  @Column({description: "출고계획 아이디"})
  public issuePlanId!: number;

  @Column({description: "출고 No", nullable: true})
  public code?: string;

  @Column({description: "출고 No.seq", nullable: true})
  public codeSeq?: number;

  @Column({description: "거래처 아이디"})
  public partnerId!: number;

  @Column({description: "출고품목"})
  public goodId!: number;

  @Column({description: "지시수량", dataType: "DECIMAL(17,6)"})
  public orderQuantity!: number;

  @Column({description: "출하수량", dataType: "DECIMAL(17,6)"})
  public issueQuantity!: number;

  @Column({description: "비고", nullable: true})
  public remark?: string;

  @Column({description: "ERP출고 아이디", nullable: true})
  public erpSync?: number;

  @Column({description: "등록사원"})
  public createdByEmployeeId!: number;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  @Column({description: "최종수정사원", nullable: true})
  public lastModifiedEmployeeId?: number;

  @Column({description: "최종수정일", nullable: true})
  public lastModifiedAtDateTime?: DateTime;

  @Column({description: "취소"})
  public isDisabled!: boolean;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("issuePlanId", () => GoodsIssuePlan, "출고계획")
  public goodsIssuePlan?: GoodsIssuePlan;

  @ForeignKey("partnerId", () => Partner, "거래처")
  public partner?: Partner;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("createdByEmployeeId", () => Employee, "작업자")
  public employee?: Employee;

  @ForeignKey("lastModifiedEmployeeId", () => Employee, "최종 작업자")
  public lastEmployee?: Employee;

  //------------------------------------

  @ForeignKeyTarget(() => GoodsIssueGoods, "goodsIssue", "출고별 품목")
  public goodsIssueGoods?: GoodsIssueGoods[];

}