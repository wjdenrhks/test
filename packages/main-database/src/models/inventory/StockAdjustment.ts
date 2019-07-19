import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Warehouse} from "../base-info/Warehouse";
import {DateOnly, DateTime} from "@simplism/core";
import {Employee} from "../base-info/Employee";
import {Goods} from "../base-info/Goods";
import {LotHistory} from "./LotHistory";


@Table({description: "재고조정"})
export class StockAdjustment {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "조정일"})
  public dueDate!: DateOnly;

  @Column({description: "LOT", nullable: true})
  public lotId?: number;

  @Column({description: "품목 아이디"})
  public goodsId!: number;

  @Column({description: "품목 등급", nullable: true})
  public goodsRating?: "A" | "B" | "C" | "공통";

  @Column({description: "창고 아이디"})
  public warehouseId!: number;

  @Column({description: "기존수량", dataType: "DECIMAL(17,6)"})
  public fromQuantity!: number;

  @Column({description: "조정수량", dataType: "DECIMAL(17,6)"})
  public toQuantity!: number;

  @Column({description: "사유", nullable: true})
  public remark?: string;

  @Column({description: "처리일시"})
  public createdAtDateTime!: DateTime;

  @Column({description: "처리사원 아이디"})
  public createdByEmployeeId!: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodsId", () => Goods, "조정품목")
  public goods?: Goods;

  @ForeignKey("lotId", () => LotHistory, "LOT")
  public lot?: LotHistory;

  @ForeignKey("warehouseId", () => Warehouse, "창고")
  public warehouse?: Warehouse;

  @ForeignKey("createdByEmployeeId", () => Employee, "처리사원")
  public employee?: Employee;
}