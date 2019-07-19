import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Goods} from "./Goods";
import {Company} from "./Company";
import {BaseType} from "./BaseType";
import {GoodsInspection} from "./GoodsInspection";

@Table({description: "X-bar 기준값"})
export class GoodsInspectionChart {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "품목 아이디"})
  public goodsId!: number;

  @Column({description: "QC검사 항목 아이디"})
  public goodsInspectionId!: number;

  @Column({description: "검사항목 아이디"})
  public inspectionId!: number;

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


  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodsId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("inspectionId", () => BaseType, "검사항목")
  public inspection?: BaseType;

  @ForeignKey("goodsInspectionId", () => GoodsInspection, "QC검사 항목")
  public goodsInspection?: GoodsInspection;
}