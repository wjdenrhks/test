import {Company} from "./Company";
import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Goods} from "./Goods";
import {GoodsGroup} from "./GoodsGroup";

@Table({description: "제품 그룹별 산출 품목"})
export class GoodsGroupProductionGoods {
  @Column({description: "업체", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "제품그룹 아이디", nullable: true})
  public goodsGroupId?: number;

  @Column({description: "타입"})
  public type!: "재생" | "판매";

  @Column({description: "품목 아이디", nullable: true})
  public goodId?: number;

  @Column({description: "순서", nullable: true})
  public seq?: number;

  @Column({description: "산출품목 아이디"})
  public productionGoodId!: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodsGroupId", () => GoodsGroup, "제품 그룹")
  public goodsGroupInfo?: GoodsGroup;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("productionGoodId", () => Goods, "산출웊목")
  public productionGoods?: Goods;

}