import {Company} from "./Company";
import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {DateTime} from "@simplism/core";
import {Employee} from "./Employee";
import {GoodsBuildGoods} from "./GoodsBuildGoods";
import {GoodsBuild} from "./GoodsBuild";
import {Goods} from "./Goods";


@Table({description: "BOM 리스트"})
export class GoodsBuildList {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "BOM 아이디"})
  public bomId!: number;

  @Column({description: "BOM 그룹명", nullable: true})
  public groupName?: string;

  @Column({description: "BOM그룹 List아이디", nullable: true})
  public bomGroupListId?: number;

  @Column({description: "품목 아이디", nullable: true})
  public goodId?: number;

  @Column({description: "순서"})
  public seq!: number;

  @Column({description: "명칭"})
  public name!: string;

  @Column({description: "총 투입량(g)"})
  public totalWeight!: number;

  @Column({description: "등록자"})
  public createdByEmployeeId!: number;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  @Column({description: "기본설정"})
  public isStander!: boolean;

  @Column({description: "사용중지"})
  public isDisabled!: boolean;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("bomId", () => GoodsBuild, "BOM")
  public bomInfo?: GoodsBuild;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("createdByEmployeeId", () => Employee, "등록자")
  public employee?: Employee;

  //------------------------------------

  @ForeignKeyTarget(() => GoodsBuildGoods, "bomList", "BOM별 구성 목록")
  public goodsBuildGoods?: GoodsBuildGoods[];
}