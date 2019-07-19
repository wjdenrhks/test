import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Employee} from "../base-info/Employee";
import {DateTime} from "@simplism/core";
import {ProductionPlan} from "./ProductionPlan";
import {GoodsBuildGoods} from "../..";

@Table({description: "생산계획 항목"})
export class ProductionPlanItem {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "생산계획 아이디"})
  public productionPlanId!: number;

  @Column({description: "품목 BOM 아이디"})
  public goodsBuildGoodsId!: number;

  @Column({description: "재고량", nullable: true, dataType: "DECIMAL(17,6)"})
  public stockQuantity?: number;

  @Column({description: "수주량", nullable: true, dataType: "DECIMAL(17,6)"})
  public salesQuantity?: number;

  @Column({description: "예상소요량", nullable: true, dataType: "DECIMAL(17,6)"})
  public requirementQuantity?: number;

  @Column({description: "적정재고", nullable: true, dataType: "DECIMAL(17,6)"})
  public adequateStock?: number;

  @Column({description: "과부족(현)", nullable: true, dataType: "DECIMAL(17,6)"})
  public currentExcessiveQuantity?: number;

  @Column({description: "과부족(적정재고)", nullable: true, dataType: "DECIMAL(17,6)"})
  public adequateExcessiveQuantity?: number;

  @Column({description: "작성자 아이디"})
  public createdByEmployeeId!: number;

  @Column({description: "작성일시"})
  public createdAtDateTime!: DateTime;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("productionPlanId", () => ProductionPlan, "생산계획")
  public plan?: ProductionPlan;

  @ForeignKey("goodsBuildGoodsId", () => GoodsBuildGoods, "품목BOM")
  public goodsBuildGoods?: GoodsBuildGoods;

  @ForeignKey("createdByEmployeeId", () => Employee, "작성자")
  public employee?: Employee;

}