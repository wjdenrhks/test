import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Goods} from "./Goods";
import {DateTime} from "@simplism/core";
import {Employee} from "./Employee";
import {Company} from "./Company";
import {BaseType} from "./BaseType";
import {ProductionInfo} from "./ProductionInfo";
import {GoodsGroup} from "./GoodsGroup";

@Table({description: "제품별 QC검사 항목"})
export class GoodsInspection {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "생산정보 아이디", nullable: true})
  public productionInfoId?: number;

  @Column({description: "제품그룹 아이디", nullable: true})
  public goodsGroupId?: number;

  @Column({description: "품목 아이디", nullable: true})
  public goodsId?: number;

  @Column({description: "검사항목 아이디"})
  public inspectionId!: number;

  @Column({description: "시험방법", nullable: true})
  public testType?: string;

  @Column({description: "단위", nullable: true})
  public unit?: string;

  @Column({description: "규격", nullable: true})
  public specification?: string;

  @Column({description: "X-bar 차트 기준"})
  public isUsingChart!: boolean;

  @Column({description: "검사값", dataType: "DECIMAL(17,6)", nullable: true})
  public inspectionValue?: number;

  @Column({description: "최소값", dataType: "DECIMAL(17,6)", nullable: true})
  public min?: number;

  @Column({description: "평균값", dataType: "DECIMAL(17,6)", nullable: true})
  public avg?: number;

  @Column({description: "최대값", dataType: "DECIMAL(17,6)", nullable: true})
  public max?: number;

  @Column({description: "표준편차 최소값", dataType: "DECIMAL(17,6)", nullable: true})
  public standardDeviationMin?: number;

  @Column({description: "표준편차 평균값", dataType: "DECIMAL(17,6)", nullable: true})
  public standardDeviationAvg?: number;

  @Column({description: "표준편차 최대값", dataType: "DECIMAL(17,6)", nullable: true})
  public standardDeviationMax?: number;

  @Column({description: "작성자"})
  public createdByEmployeeId!: number;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("productionInfoId", () => ProductionInfo, "품목")
  public productionInfo?: ProductionInfo;

  @ForeignKey("goodsGroupId", () => GoodsGroup, "제품그룹")
  public goodsGroupInfo?: GoodsGroup;

  @ForeignKey("goodsId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("inspectionId", () => BaseType, "검사항목")
  public inspection?: BaseType;

  @ForeignKey("createdByEmployeeId", () => Employee, "작업자")
  public employee?: Employee;

}