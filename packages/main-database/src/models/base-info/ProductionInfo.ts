import {Company} from "./Company";
import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {DateTime} from "@simplism/core";
import {GoodsInspection} from "./GoodsInspection";
import {EquipmentByGoods} from "./EquipmentByGoods";
import {GoodsProductionGoods} from "./GoodsProductionGoods";
import {Goods} from "./Goods";
import {GoodsSaleGoods} from "./GoodsSaleGoods";

@Table({description: "생산정보"})
export class ProductionInfo {
  @Column({description: "업체", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "품목 아이디"})
  public goodId!: number;

  @Column({description: "생산(양:1 /단:0)", nullable: true})
  public bothSides?: boolean;

  @Column({description: "사용중지 여부"})
  public isDisabled!: boolean;

  @Column({description: "등록자"})
  public createdByEmployeeId!: number;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  @Column({description: "수정사원", nullable: true})
  public modifyByEmployeeId?: number;

  @Column({description: "수정일", nullable: true})
  public modifyAtDateTime?: DateTime;

  @Column({description: "산출품목 리스트 여부", nullable: true})
  public isProductionGoods?: boolean;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

  //------------------------------------

  @ForeignKeyTarget(() => EquipmentByGoods, "productionInfo", "제품별 설비 목록")
  public equipment?: EquipmentByGoods[];

  @ForeignKeyTarget(() => GoodsProductionGoods, "productionInfo", "제품별 재생 목록")
  public productionGoods?: GoodsProductionGoods[];

  @ForeignKeyTarget(() => GoodsSaleGoods, "saleInfo", "제품별 재생 목록")
  public saleGoods?: GoodsSaleGoods[];

  @ForeignKeyTarget(() => GoodsInspection, "productionInfo", "제품별 검사 목록")
  public inspections?: GoodsInspection[];

}