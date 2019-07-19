import {Company} from "./Company";
import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Goods} from "./Goods";
import {ProductionInfo} from "./ProductionInfo";
import {GoodsGroup} from "./GoodsGroup";

@Table({description: "제품별 산출 품목"})
export class GoodsProductionGoods {
  @Column({description: "업체", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "생산정보 아이디", nullable: true})
  public productionInfoId?: number;

  @Column({description: "생산정보 품목 아이디", nullable: true})
  public productionInfoGoodId?: number;

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

  @ForeignKey("productionInfoId", () => ProductionInfo, "품목")
  public productionInfo?: ProductionInfo;

  @ForeignKey("goodsGroupId", () => GoodsGroup, "제품 그룹")
  public goodsGroupInfo?: GoodsGroup;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("productionGoodId", () => Goods, "산출웊목")
  public productionGoods?: Goods;

}