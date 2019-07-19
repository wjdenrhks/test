import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Warehouse} from "../base-info/Warehouse";
import {Goods} from "../..";

@Table({description: "가용재고"})
export class AvailableStock {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "품목 아이디"})
  public goodId!: number;

  @Column({description: "창고 아이디", nullable: true})
  public warehouseId?: number;

  @Column({description: "재고량", dataType: "DECIMAL(17,6)"})
  public quantity!: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("warehouseId", () => Warehouse, "창고")
  public warehouse?: Warehouse;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

}