import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Warehouse} from "../base-info/Warehouse";
import {Employee} from "../base-info/Employee";
import {DateOnly, DateTime} from "@simplism/core";
import {Goods} from "../base-info/Goods";
import {LotHistory} from "./LotHistory";

@Table({description: "재고 이동"})
export class StockTransfer {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "이동일"})
  public dueDate!: DateOnly;

  @Column({description: "LOT", nullable: true})
  public lotId?: number;

  @Column({description: "품목 아이디"})
  public goodsId!: number;

  @Column({description: "품목 등급", nullable: true})
  public goodsRating?: "A" | "B" | "C" | "공통";

  @Column({description: "출발창고 아이디"})
  public fromWarehouseId!: number;

  @Column({description: "도착창고 아이디"})
  public toWarehouseId!: number;

  @Column({description: "이동량", dataType: "DECIMAL(17,6)"})
  public quantity!: number;

  @Column({description: "비고", nullable: true})
  public remark?: string;

  @Column({description: "처리일시"})
  public createdAtDateTime!: DateTime;

  @Column({description: "처리사원 아이디"})
  public createdByEmployeeId!: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodsId", () => Goods, "이동품목")
  public goods?: Goods;

  @ForeignKey("lotId", () => LotHistory, "LOT")
  public lot?: LotHistory;

  @ForeignKey("fromWarehouseId", () => Warehouse, "출발창고")
  public fromWarehouse?: Warehouse;

  @ForeignKey("toWarehouseId", () => Warehouse, "도착창고")
  public toWarehouse?: Warehouse;

  @ForeignKey("createdByEmployeeId", () => Employee, "처리사원")
  public employee?: Employee;
}