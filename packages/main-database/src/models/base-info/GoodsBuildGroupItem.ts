import {Company} from "./Company";
import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Goods} from "./Goods";
import {GoodsBuild} from "./GoodsBuild";


@Table({description: "BOM그룹별 품목 구성"})
export class GoodsBuildGroupItem {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "그룹 아이디"})
  public goodsBuildGroupId!: number;

  @Column({description: "그룹화 품목 아이디"})
  public goodId!: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodsBuildGroupId", () => GoodsBuild, "BOM 그룹 리스트")
  public goodsBuildGroup?: GoodsBuild;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

}