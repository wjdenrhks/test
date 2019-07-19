import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {DateOnly, DateTime} from "@simplism/core";
import {BaseType, Company, Employee, Goods, Partner, ProductionInstruction} from "../..";
import {GoodsIssuePlanItem} from "./GoodsIssuePlanItem";

@Table({description: "출하계획"})
export class GoodsIssuePlan {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "생산계획(년)", nullable: true})
  public planYear?: number;

  @Column({description: "생산계획(월)", nullable: true})
  public planMonth?: number;

  @Column({description: "일", nullable: true})
  public planDay?: number;

  @Column({description: "계획일", nullable: true})
  public planDate?: DateOnly;

  @Column({description: "주", nullable: true})
  public week?: number;

  @Column({description: "구분"})
  public type!: "내수용" | "수출용";

  @Column({description: "계획 구분", nullable: true})
  public planType?: "확정" | "예상" | "추가";

  @Column({description: "거래처 아이디"})
  public partnerId!: number;

  @Column({description: "출고품목"})
  public goodId!: number;

  @Column({description: "계획수량"})
  public planQuantity!: number;

  @Column({description: "재고출하", nullable: true})
  public stockQuantity?: number;

  @Column({description: "생산출하", nullable: true})
  public productionQuantity?: number;

  @Column({description: "실제 출하수량", nullable: true})
  public realIssueQuantity?: number;

  @Column({description: "배차", nullable: true})
  public allocateTypeId?: number;

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

  @Column({description: "생산지시 등록여부", nullable: true})
  public isProductionInstruction?: number;

  @Column({description: "종결여부"})
  public isClosed!: boolean;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("partnerId", () => Partner, "거래처")
  public partner?: Partner;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("isProductionInstruction", () => ProductionInstruction, "배차")
  public productionInstruction?: ProductionInstruction;

  @ForeignKey("allocateTypeId", () => BaseType, "배차")
  public allocateType?: BaseType;

  @ForeignKey("createdByEmployeeId", () => Employee, "작업자")
  public employee?: Employee;

  @ForeignKey("lastModifiedEmployeeId", () => Employee, "최종 작업자")
  public lastEmployee?: Employee;

  //------------------------------------

  @ForeignKeyTarget(() => GoodsIssuePlanItem, "goodsIssuePlan", "출하계획 별 품목")
  public goodsIssuePlanItems?: GoodsIssuePlanItem[];
}