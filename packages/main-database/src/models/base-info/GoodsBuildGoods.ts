import {Company} from "./Company";
import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {DateTime} from "@simplism/core";
import {Employee} from "./Employee";
import {Goods} from "./Goods";
import {GoodsBuildList} from "./GoodsBuildList";


@Table({description: "BOM별 구성"})
export class GoodsBuildGoods {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "BOM리스트 아이디"})
  public bomListId!: number;

  @Column({description: "투입층", nullable: true})
  public type?: "외층" | "중층" | "내층";

  @Column({description: "구분별 순서"})
  public typeSeq!: number;

  @Column({description: "원재료 아이디"})
  public goodsId!: number;

  @Column({description: "배합비", dataType: "DECIMAL(17,6)", nullable: true})
  public mixPercent?: number;

  @Column({description: "총 중량", dataType: "DECIMAL(17,6)"})
  public totalWeight!: number;

  @Column({description: "중량", dataType: "DECIMAL(17,6)", nullable: true})
  public weight?: number;

  @Column({description: "등록자"})
  public createdByEmployeeId!: number;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  @Column({description: "수정자", nullable: true})
  public modifyEmployeeId?: number;

  @Column({description: "수정일", nullable: true})
  public modifyAtDateTime?: DateTime;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("createdByEmployeeId", () => Employee, "등록자")
  public employee?: Employee;

  @ForeignKey("modifyEmployeeId", () => Employee, "등록자")
  public modifyEmployee?: Employee;

  @ForeignKey("bomListId", () => GoodsBuildList, "BOM 리스트")
  public bomList?: GoodsBuildList;

  @ForeignKey("goodsId", () => Goods, "BOM구성 품목")
  public goods?: Goods;

}