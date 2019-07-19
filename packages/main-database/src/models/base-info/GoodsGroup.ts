import {Company} from "./Company";
import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {DateTime} from "@simplism/core";
import {Employee} from "./Employee";
import {GoodsGroupItem} from "./GoodsGroupItem";
import {EquipmentByGoods} from "./EquipmentByGoods";
import {GoodsInspection} from "./GoodsInspection";
import {GoodsGroupProductionGoods} from "./GoodsGroupProductionGoods";


@Table({description: "품목 그룹"})
export class GoodsGroup {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "품목명"})
  public groupName!: string;

  @Column({description: "생산(양:1 /단:0)", nullable: true})
  public bothSides?: boolean;

  @Column({description: "등록자"})
  public createdByEmployeeId!: number;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  @Column({description: "수정자", nullable: true})
  public modifyEmployeeId?: number;

  @Column({description: "수정일", nullable: true})
  public modifyAtDateTime?: DateTime;

  @Column({description: "사용중지"})
  public isDisabled!: boolean;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("createdByEmployeeId", () => Employee, "등록자")
  public employee?: Employee;

  @ForeignKey("modifyEmployeeId", () => Employee, "수정자")
  public modifyEmployee?: Employee;

  //------------------------------------

  @ForeignKeyTarget(() => GoodsGroupItem, "goodsGroup", "그룹별 제품 리스트")
  public goodsGroupItem?: GoodsGroupItem[];

  @ForeignKeyTarget(() => EquipmentByGoods, "goodsGroupInfo", "제품별 설비 목록")
  public equipment?: EquipmentByGoods[];

  @ForeignKeyTarget(() => GoodsGroupProductionGoods, "goodsGroupInfo", "제품별 재생 목록")
  public productionGoods?: GoodsGroupProductionGoods[];

  @ForeignKeyTarget(() => GoodsInspection, "goodsGroupInfo", "제품별 검사 목록")
  public inspections?: GoodsInspection[];
}