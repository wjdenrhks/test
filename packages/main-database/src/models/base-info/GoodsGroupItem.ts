import {Company} from "./Company";
import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Goods} from "./Goods";
import {GoodsGroup} from "./GoodsGroup";


@Table({description: "제품그룹 구성"})
export class GoodsGroupItem {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "제품 그룹 아이디"})
  public goodGroupId!: number;

  @Column({description: "그룹화 품목 아이디"})
  public goodId!: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodGroupId", () => GoodsGroup, "제품 그룹 리스트")
  public goodsGroup?: GoodsGroup;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

}