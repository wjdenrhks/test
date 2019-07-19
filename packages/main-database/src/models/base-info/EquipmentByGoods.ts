import {Company} from "./Company";
import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Goods} from "./Goods";
import {Equipment} from "./Equipment";
import {ProductionInfo} from "./ProductionInfo";
import {GoodsGroup} from "./GoodsGroup";

@Table({description: "제품별 설비정보"})
export class EquipmentByGoods {
  @Column({description: "ID", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "생산정보 아이디", nullable: true})
  public productionInfoId?: number;

  @Column({description: "제품그룹 아이디", nullable: true})
  public goodsGroupId?: number;

  @Column({description: "품목 아이디", nullable: true})
  public goodId?: number;

  @Column({description: "순서", nullable: true})
  public seq?: number;

  @Column({description: "설비 아이디"})
  public equipmentId!: number;

  @Column({description: "수량", dataType: "DECIMAL(17,6)"})
  public quantity?: number;

  @Column({description: "시간", dataType: "DECIMAL(17,6)"})
  public leadTime?: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("productionInfoId", () => ProductionInfo, "품목")
  public productionInfo?: ProductionInfo;

  @ForeignKey("goodsGroupId", () => GoodsGroup, "제품그룹")
  public goodsGroupInfo?: GoodsGroup;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("equipmentId", () => Equipment, "설비")
  public equipments?: Equipment;

}