
import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {
  Company, GoodsReceipt, Production,
  ProductionInstruction
} from "../..";
import {Goods} from "../base-info/Goods";
import {DateOnly, DateTime} from "@simplism/core";
import {Employee} from "../../index";
import {QuantityCheckInspectionItem} from "./QuantityCheckInspectionItem";

@Table({description: "QC검사"})
export class QuantityCheckInspection {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "구분"})
  public type!: "일반" | "반품";

  @Column({description: "검사 날짜", nullable: true})
  public testDate?: DateOnly;

  @Column({description: "생산 아이디", nullable: true})
  public productionId?: number;

  @Column({description: "생산지시 아이디", nullable: true})
  public productionInstructionId?: number;

  @Column({description: "입고반품 아이디", nullable: true})
  public receiptId?: number;

  @Column({description: "품목"})
  public goodsId!: number;

  @Column({description: "비고", nullable: true})
  public remark?: string;

  @Column({description: "취소"})
  public isDisabled!: boolean;

  @Column({description: "작성자"})
  public createdByEmployeeId!: number;

  @Column({description: "작성일"})
  public createdAtDateTime!: DateTime;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("productionInstructionId", () => ProductionInstruction, "생산지시")
  public productionInstruction?: ProductionInstruction;

  @ForeignKey("productionId", () => Production, "생산")
  public production?: Production;

  @ForeignKey("receiptId", () => GoodsReceipt, "입고반품")
  public receipt?: GoodsReceipt;

  @ForeignKey("goodsId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("createdByEmployeeId", () => Employee, "사원")
  public employee?: Employee;

  //------------------------------------

  @ForeignKeyTarget(() => QuantityCheckInspectionItem, "quantityCheckInspection", "QC검사 별 목록")
  public inspectionDetails?: QuantityCheckInspectionItem[];
}