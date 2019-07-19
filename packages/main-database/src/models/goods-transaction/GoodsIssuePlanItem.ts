import {Column, ForeignKey,  Table} from "@simplism/orm-query";
import { DateTime} from "@simplism/core";
import {Company, Employee, LotHistory, Warehouse} from "../..";
import {Goods} from "../base-info/Goods";
import {GoodsIssuePlan} from "./GoodsIssuePlan";

@Table({description: "출하계획 항목"})
export class GoodsIssuePlanItem {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "출고계획 아이디"})
  public goodsIssuePlanId!: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "품목 아이디"})
  public goodsId!: number;

  @Column({description: "LOT", nullable: true})
  public lotId?: number;

  @Column({description: "창고", nullable: true})
  public warehouseId?: number;

  @Column({description: "수량", dataType: "DECIMAL(17,6)"})
  public quantity!: number;

  @Column({description: "비고", nullable: true})
  public remark?: string;

  @Column({description: "작성자"})
  public createdByEmployeeId!: number;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  @Column({description: "취소"})
  public isDisabled!: boolean;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodsIssuePlanId", () => GoodsIssuePlan, "출하계획")
  public goodsIssuePlan?: GoodsIssuePlan;

  @ForeignKey("warehouseId", () => Warehouse, "창고")
  public warehouse?: Warehouse;

  @ForeignKey("lotId", () => LotHistory, "LOT")
  public lot?: LotHistory;

  @ForeignKey("goodsId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("createdByEmployeeId", () => Employee, "작업자")
  public employee?: Employee;

}