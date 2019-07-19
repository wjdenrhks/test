import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Goods} from "../base-info/Goods";

@Table({description: "재고마감"})
export class StockClosed {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "년"})
  public year!: number;

  @Column({description: "월"})
  public month!: number;

  @Column({description: "제품 아이디"})
  public goodsId!: number;

  @Column({description: "재고량", dataType: "DECIMAL(17,6)"})
  public quantity!: number;

  @Column({description: "제품등급", nullable: true})
  public rating?: "A" | "B" | "C" | "공통";

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodsId", () => Goods, "품목")
  public goods?: Goods;
}