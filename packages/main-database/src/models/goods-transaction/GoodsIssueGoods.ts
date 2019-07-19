import {Column, ForeignKey,  Table} from "@simplism/orm-query";
import { DateTime} from "@simplism/core";
import {Company, Employee, GoodsIssue, LotHistory, Packing, Warehouse} from "../..";
import {Goods} from "../base-info/Goods";

@Table({description: "출고항목"})
export class GoodsIssueGoods {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "출고 아이디"})
  public goodsIssueId!: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "품목 아이디"})
  public goodsId!: number;

  @Column({description: "포장 LOT", nullable: true})
  public packingLotId?: number;

  @Column({description: "LOT", nullable: true})
  public lotId?: number;

  @Column({description: "창고", nullable: true})
  public warehouseId?: number;

  @Column({description: "수량", dataType: "DECIMAL(17,6)"})
  public quantity!: number;

  @Column({description: "단가", nullable: true})
  public unitPrice?: number;

  @Column({description: "금액", nullable: true})
  public totalPrice?: number;

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

  @ForeignKey("goodsIssueId", () => GoodsIssue, "출고")
  public goodsIssue?: GoodsIssue;

  @ForeignKey("warehouseId", () => Warehouse, "창고")
  public warehouse?: Warehouse;

  @ForeignKey("packingLotId", () => Packing, "PackingLot")
  public packingLot?: Packing;

  @ForeignKey("lotId", () => LotHistory, "LOT")
  public lot?: LotHistory;

  @ForeignKey("goodsId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("createdByEmployeeId", () => Employee, "작업자")
  public employee?: Employee;

}